"""FastAPI 安全网关主入口

职责：
1. 持有 API Key，前端绝不接触密钥
2. 统一转发到 Kimi / Codex（OpenAI 兼容）
3. 以 Vercel AI SDK 数据流协议返回，供前端 useChat 直接消费
4. 限流、日志、错误处理
5. 会话管理（LibreChat 风格：多会话、系统提示词、临时对话）
"""
import json
import logging
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from . import __version__
from .config import settings
from .crud import (
    add_message,
    create_conversation,
    delete_conversation,
    get_conversation,
    list_conversations,
    list_messages,
    search_messages,
    update_conversation,
)
from .db import get_db, init_db
from .middleware.logging import AccessLogMiddleware
from .middleware.request_id import RequestIdMiddleware, request_id_ctx
from .providers import get_provider, list_providers, provider_details
from .providers.base import ProviderError
from .schemas import (
    ChatRequest,
    ConversationCreate,
    ConversationDetail,
    ConversationOut,
    ConversationUpdate,
    HealthResponse,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("ai_assistant")

app = FastAPI(title="AI Assistant Gateway", version=__version__)

app.add_middleware(AccessLogMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    logger.info("database initialized")


# 简易内存限流器（按客户端 IP）
_rate_buckets: Dict[str, Deque[float]] = defaultdict(deque)


def _is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    bucket = _rate_buckets[client_ip]
    while bucket and now - bucket[0] > 60:
        bucket.popleft()
    if len(bucket) >= settings.rate_limit_per_minute:
        return True
    bucket.append(now)
    return False


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ============ 健康检查 ============
@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", version=__version__)


@app.get("/health/detail")
async def health_detail() -> dict:
    return {"status": "ok", "version": __version__, "providers": provider_details()}


# ============ 供应商 ============
@app.get("/api/providers")
async def providers() -> dict:
    return {"providers": list_providers()}


@app.get("/api/providers/detail")
async def providers_detail() -> dict:
    return {"providers": provider_details()}


# ============ 会话管理（LibreChat 风格） ============
@app.get("/api/conversations", response_model=list[ConversationOut])
def api_list_conversations(db: Session = Depends(get_db)):
    """列出所有会话（按更新时间倒序）。"""
    return list_conversations(db)


@app.post("/api/conversations", response_model=ConversationOut, status_code=201)
def api_create_conversation(body: ConversationCreate, db: Session = Depends(get_db)):
    """创建新会话。"""
    conv = create_conversation(
        db,
        title=body.title,
        provider=body.provider,
        system_prompt=body.system_prompt,
        is_temporary=body.is_temporary,
    )
    return conv


@app.get("/api/conversations/{conv_id}", response_model=ConversationDetail)
def api_get_conversation(conv_id: str, db: Session = Depends(get_db)):
    """获取会话详情（含消息历史）。"""
    conv = get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")
    return conv


@app.patch("/api/conversations/{conv_id}", response_model=ConversationOut)
def api_update_conversation(
    conv_id: str, body: ConversationUpdate, db: Session = Depends(get_db)
):
    """更新会话（标题、供应商、系统提示词）。"""
    conv = get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")
    fields = body.model_dump(exclude_unset=True)
    return update_conversation(db, conv, **fields)


@app.delete("/api/conversations/{conv_id}", status_code=204)
def api_delete_conversation(conv_id: str, db: Session = Depends(get_db)):
    """删除会话及其所有消息。"""
    conv = get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")
    delete_conversation(db, conv)
    return None


@app.get("/api/conversations/{conv_id}/messages")
def api_list_messages(conv_id: str, db: Session = Depends(get_db)):
    """获取会话的消息列表。"""
    conv = get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")
    return list_messages(db, conv_id)


@app.get("/api/search")
def api_search(keyword: str, db: Session = Depends(get_db)):
    """跨会话搜索消息。"""
    if not keyword.strip():
        return {"results": []}
    results = search_messages(db, keyword.strip())
    return {"results": results}


# ============ 聊天（流式） ============
@app.post("/api/chat")
async def chat(request: Request, db: Session = Depends(get_db)):
    client_ip = _client_ip(request)
    if _is_rate_limited(client_ip):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁，请稍后再试")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="请求体必须是 JSON")

    try:
        chat_req = ChatRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"参数错误: {e}")

    provider_name = chat_req.provider
    try:
        provider = get_provider(provider_name)
    except ProviderError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 输入校验
    if len(chat_req.messages) > settings.max_messages:
        raise HTTPException(status_code=413, detail=f"消息数量超过上限 {settings.max_messages}")
    for i, m in enumerate(chat_req.messages):
        if len(m.content) > settings.max_message_length:
            raise HTTPException(status_code=413, detail=f"第 {i + 1} 条消息长度超过上限 {settings.max_message_length}")
        if m.role not in {"system", "user", "assistant"}:
            raise HTTPException(status_code=422, detail=f"非法角色: {m.role}")

    messages = [m.model_dump() for m in chat_req.messages]
    logger.info(
        "chat request req_id=%s ip=%s provider=%s msgs=%d conv=%s",
        request_id_ctx.get(), client_ip, provider_name, len(messages),
        chat_req.conversation_id or "-",
    )

    # 若关联会话，将用户消息持久化
    conv = None
    if chat_req.conversation_id:
        conv = get_conversation(db, chat_req.conversation_id)
        if conv and not conv.is_temporary:
            last_user = next((m for m in reversed(chat_req.messages) if m.role == "user"), None)
            if last_user:
                add_message(db, conv.id, "user", last_user.content)

    async def generate():
        full_response = []
        try:
            async for delta in provider.chat_stream(
                messages,
                model=chat_req.model,
                temperature=chat_req.temperature,
                max_tokens=chat_req.max_tokens,
            ):
                full_response.append(delta)
                yield f'0:{json.dumps(delta, ensure_ascii=False)}\n'
        except ProviderError as e:
            logger.error("provider error: %s", e)
            yield f'2:{json.dumps(str(e), ensure_ascii=False)}\n'
            return
        except Exception as e:  # noqa: BLE001
            logger.exception("unexpected error")
            yield f'2:{json.dumps(f"内部错误: {e}", ensure_ascii=False)}\n'
            return

        # 持久化助手回复
        if conv and not conv.is_temporary:
            reply = "".join(full_response)
            if reply.strip():
                add_message(db, conv.id, "assistant", reply)

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")

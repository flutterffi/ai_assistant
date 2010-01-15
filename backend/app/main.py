"""FastAPI 安全网关主入口

职责：
1. 持有 API Key，前端绝不接触密钥
2. 统一转发到 Kimi / Codex（OpenAI 兼容）
3. 以 Vercel AI SDK 数据流协议返回，供前端 useChat 直接消费
4. 限流、日志、错误处理
"""
import json
import logging
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import __version__
from .config import settings
from .providers import get_provider, list_providers
from .providers.base import ProviderError
from .schemas import ChatRequest, HealthResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("ai_assistant")

app = FastAPI(title="AI Assistant Gateway", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", version=__version__)


@app.get("/api/providers")
async def providers() -> dict:
    return {"providers": list_providers()}


@app.post("/api/chat")
async def chat(request: Request):
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

    messages = [m.model_dump() for m in chat_req.messages]
    logger.info("chat request ip=%s provider=%s msgs=%d", client_ip, provider_name, len(messages))

    async def generate():
        # AI SDK 数据流协议：每行 "type:json_value"
        # 0 = 文本增量，2 = 错误
        try:
            async for delta in provider.chat_stream(
                messages,
                model=chat_req.model,
                temperature=chat_req.temperature,
                max_tokens=chat_req.max_tokens,
            ):
                yield f'0:{json.dumps(delta, ensure_ascii=False)}\n'
        except ProviderError as e:
            logger.error("provider error: %s", e)
            yield f'2:{json.dumps(str(e), ensure_ascii=False)}\n'
        except Exception as e:  # noqa: BLE001
            logger.exception("unexpected error")
            yield f'2:{json.dumps(f"内部错误: {e}", ensure_ascii=False)}\n'

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")

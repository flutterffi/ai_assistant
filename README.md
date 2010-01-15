# AI Assistant

基于「前后端分离 + 安全网关」架构的 AI 助手。前端只负责界面与流式渲染，所有模型 API Key 由后端持有并中转调用。

## 架构

```
┌────────────────────┐      HTTP/SSE       ┌──────────────────────────────┐
│  Next.js (React)   │ ──────────────────▶ │   FastAPI 安全网关            │
│  + Vercel AI SDK   │                     │   - 持有 Kimi / Codex 密钥    │
│  + Tailwind CSS    │ ◀────────────────── │   - 统一格式 / 限流 / 日志     │
└────────────────────┘      数据流协议      └──────────┬───────────────────┘
                                                       │
                                         ┌─────────────┼─────────────┐
                                         ▼             ▼             ▼
                                    Kimi API      Codex API     其他 OpenAI 兼容
```

## 目录

- `backend/` — FastAPI 安全网关 + 模型编排层
- `frontend/` — Next.js 前端

## 快速开始

### 后端

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 填入 KIMI_API_KEY / OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

访问 http://localhost:3000

## 安全原则

- API Key 仅存在于后端 `.env`，前端通过环境变量只拿到后端地址。
- 后端对客户端做限流、日志，异常以数据流 `type=2` 返回。
- `.env` 已被 `.gitignore`，仓库中只保留 `.env.example`。

# AI Assistant

基于「前后端分离 + 安全网关」架构的 AI 助手。前端只负责界面与流式渲染，所有模型 API Key 由后端持有并中转调用，支持 Kimi 与 Codex（OpenAI 兼容）供应商。

## 架构

```
┌────────────────────┐      HTTP / 数据流协议      ┌──────────────────────────────┐
│  Next.js (React)   │ ──────────────────────────▶ │   FastAPI 安全网关            │
│  + Vercel AI SDK   │                             │   - 持有 Kimi / Codex 密钥    │
│  + Tailwind CSS    │ ◀────────────────────────── │   - 统一格式 / 限流 / 日志     │
└────────────────────┘                             └──────────┬───────────────────┘
                                                              │
                                            ┌─────────────────┼─────────────────┐
                                            ▼                 ▼                 ▼
                                       Kimi API        Codex API      其他 OpenAI 兼容
```

**安全原则**

- API Key 仅存在于后端 `.env`，前端通过环境变量只拿到后端地址。
- 后端对客户端做限流、日志、输入校验，异常以数据流 `type=2` 返回。
- `.env` 已被 `.gitignore`，仓库中只保留 `.env.example`。

## 目录

```
ai_assistant/
├── backend/                # FastAPI 安全网关 + 模型编排层
│   ├── app/
│   │   ├── main.py         # 入口：路由、限流、中间件
│   │   ├── config.py       # 环境变量配置
│   │   ├── schemas.py      # 请求/响应模型
│   │   ├── providers/      # 供应商抽象与实现（Kimi / OpenAI 兼容）
│   │   └── middleware/     # 请求ID、访问日志
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Next.js 前端
│   ├── app/                # App Router 页面
│   ├── components/         # ChatInterface / MessageBubble / ProviderSelector / SettingsPanel
│   ├── lib/                # API 地址、useLocalStorage hook
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 快速开始

### 后端

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # 填入 KIMI_API_KEY / OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
cp .env.example .env.local  # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

访问 http://localhost:3000

### Docker 一键部署

```bash
cp backend/.env.example backend/.env   # 填入密钥
docker compose up -d --build
```

前端 http://localhost:3000，后端 http://localhost:8000

## 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/health` | 健康检查 |
| GET  | `/health/detail` | 健康检查 + 供应商配置状态 |
| GET  | `/api/providers` | 供应商名称列表 |
| GET  | `/api/providers/detail` | 供应商详情（默认模型、密钥是否配置） |
| POST | `/api/chat` | 流式对话（数据流协议） |

### `/api/chat` 请求体

```json
{
  "messages": [{"role": "user", "content": "你好"}],
  "provider": "kimi",
  "temperature": 0.7,
  "max_tokens": null,
  "stream": true
}
```

### 响应：Vercel AI SDK 数据流协议

每行 `type:json_value`，前端 `useChat` 直接消费：

| type | 含义 |
|------|------|
| `0`  | 文本增量 |
| `2`  | 错误信息 |

## 配置项（后端 `.env`）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `KIMI_API_KEY` | — | Kimi 密钥 |
| `KIMI_BASE_URL` | `https://api.moonshot.cn/v1` | Kimi 接口地址 |
| `KIMI_MODEL` | `moonshot-v1-8k` | 默认模型 |
| `OPENAI_API_KEY` | — | OpenAI 兼容密钥（Codex 等） |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI 兼容接口地址 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 默认模型 |
| `RATE_LIMIT_PER_MINUTE` | `20` | 单 IP 每分钟请求上限 |
| `REQUEST_TIMEOUT` | `120` | 上游请求超时（秒） |
| `CORS_ORIGINS` | `http://localhost:3000` | 允许的前端来源，逗号分隔 |
| `MAX_MESSAGES` | `50` | 单次请求消息数量上限 |
| `MAX_MESSAGE_LENGTH` | `8000` | 单条消息长度上限 |

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1.0 | 2010-01 | 项目脚手架：FastAPI 网关 + Next.js 前端骨架 |
| v0.2.0 | 2010-02 | 多供应商流式代理：Kimi + Codex(OpenAI 兼容) |
| v0.3.0 | 2010-03 | 对话 UI：流式渲染 + 供应商选择器 |
| v0.4.0 | 2010-04 | 安全网关加固：请求ID + 输入校验 + 健康详情 |
| v0.5.0 | 2010-05 | 会话持久化 + 模型参数设置面板 |
| v0.6.0 | 2010-06 | Docker 部署 + 文档完善 |

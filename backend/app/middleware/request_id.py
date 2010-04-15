"""请求 ID 中间件：为每个请求生成唯一标识，便于链路追踪。"""
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        request_id_ctx.set(req_id)
        response = await call_next(request)
        response.headers["x-request-id"] = req_id
        return response

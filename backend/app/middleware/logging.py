"""请求日志中间件：记录方法、路径、状态码、耗时。"""
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from .request_id import request_id_ctx


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        # 延迟导入避免循环
        from ..main import logger

        logger.info(
            "req_id=%s %s %s status=%d cost=%.1fms",
            request_id_ctx.get(),
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )
        return response

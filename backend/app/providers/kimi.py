"""Kimi (Moonshot) 供应商 — 通过 OpenAI 兼容接口调用"""
import json
from typing import AsyncGenerator, List, Optional

import httpx

from ..config import settings
from .base import BaseProvider, ProviderError


class KimiProvider(BaseProvider):
    name = "kimi"
    default_model = settings.kimi_model

    @property
    def configured(self) -> bool:
        return bool(settings.kimi_api_key)

    def _headers(self) -> dict:
        if not settings.kimi_api_key:
            raise ProviderError("KIMI_API_KEY 未配置")
        return {
            "Authorization": f"Bearer {settings.kimi_api_key}",
            "Content-Type": "application/json",
        }

    async def chat_stream(
        self,
        messages: List[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": model or settings.kimi_model,
            "messages": messages,
            "stream": True,
        }
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        url = f"{settings.kimi_base_url.rstrip('/')}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
                async with client.stream("POST", url, headers=self._headers(), json=payload) as resp:
                    if resp.status_code != 200:
                        text = await resp.aread()
                        raise ProviderError(f"Kimi 返回 {resp.status_code}: {text.decode(errors='ignore')[:500]}")
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data = line[6:]
                        else:
                            data = line
                        if data == "[DONE]":
                            break
                        try:
                            obj = json.loads(data)
                        except json.JSONDecodeError:
                            continue
                        choices = obj.get("choices") or []
                        if not choices:
                            continue
                        delta = choices[0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield content
        except httpx.HTTPError as e:
            raise ProviderError(f"Kimi 请求失败: {e}") from e

"""供应商抽象基类"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Optional


class ProviderError(Exception):
    """供应商调用异常"""


class BaseProvider(ABC):
    name: str = "base"
    default_model: str = ""

    @property
    @abstractmethod
    def configured(self) -> bool:
        """该供应商的 API Key 是否已配置。"""

    @abstractmethod
    async def chat_stream(
        self,
        messages: List[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """以文本增量形式流式输出。"""
        yield ""  # pragma: no cover

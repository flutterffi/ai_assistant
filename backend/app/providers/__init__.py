"""模型供应商注册表"""
from .base import BaseProvider, ProviderError
from .kimi import KimiProvider
from .openai_compatible import OpenAICompatibleProvider

_REGISTRY: dict[str, BaseProvider] = {}


def register_provider(name: str, provider: BaseProvider) -> None:
    _REGISTRY[name] = provider


def get_provider(name: str) -> BaseProvider:
    provider = _REGISTRY.get(name)
    if provider is None:
        raise ProviderError(f"未知的供应商: {name}，可选: {list(_REGISTRY.keys())}")
    return provider


def list_providers() -> list[str]:
    return list(_REGISTRY.keys())


def provider_details() -> list[dict]:
    """返回每个供应商的名称、默认模型、配置状态。"""
    return [
        {
            "name": p.name,
            "default_model": p.default_model,
            "configured": p.configured,
        }
        for p in _REGISTRY.values()
    ]


# 默认注册
register_provider("kimi", KimiProvider())
register_provider("openai", OpenAICompatibleProvider())

"""应用配置：所有敏感密钥仅从环境变量读取，绝不硬编码。"""
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Kimi (Moonshot)
    kimi_api_key: str = ""
    kimi_base_url: str = "https://api.moonshot.cn/v1"
    kimi_model: str = "moonshot-v1-8k"

    # OpenAI 兼容接口（Codex / DeepSeek / 其他）
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    # 网关
    rate_limit_per_minute: int = 20
    request_timeout: int = 120
    cors_origins: str = "http://localhost:3000"

    # 输入校验
    max_messages: int = 50
    max_message_length: int = 8000

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

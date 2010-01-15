"""请求/响应数据模型"""
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="system / user / assistant")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: str = Field("kimi", description="kimi / openai")
    model: Optional[str] = Field(None, description="可选，覆盖默认模型")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1)
    stream: bool = True


class HealthResponse(BaseModel):
    status: str
    version: str

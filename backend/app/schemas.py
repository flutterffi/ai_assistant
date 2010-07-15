"""请求/响应数据模型"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---- 聊天 ----
class ChatMessage(BaseModel):
    role: str = Field(..., description="system / user / assistant")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: str = Field("kimi", description="kimi / openai")
    model: Optional[str] = Field(None, description="可选，覆盖默认模型")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1)
    conversation_id: Optional[str] = Field(None, description="关联的会话 ID")
    stream: bool = True


# ---- 会话 ----
class ConversationCreate(BaseModel):
    title: str = "新对话"
    provider: str = "kimi"
    system_prompt: str = ""
    is_temporary: bool = False


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    provider: Optional[str] = None
    system_prompt: Optional[str] = None


class ConversationOut(BaseModel):
    id: str
    title: str
    provider: str
    system_prompt: str
    is_temporary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationDetail(ConversationOut):
    messages: List[MessageOut] = []


class HealthResponse(BaseModel):
    status: str
    version: str

"""会话与消息的 CRUD 操作"""
from typing import Optional

from sqlalchemy.orm import Session

from .models import Conversation, Message


# ---- 会话 ----
def create_conversation(
    db: Session,
    title: str = "新对话",
    provider: str = "kimi",
    system_prompt: str = "",
    is_temporary: bool = False,
) -> Conversation:
    conv = Conversation(
        title=title,
        provider=provider,
        system_prompt=system_prompt,
        is_temporary=1 if is_temporary else 0,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def list_conversations(db: Session) -> list[Conversation]:
    return (
        db.query(Conversation)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


def get_conversation(db: Session, conv_id: str) -> Optional[Conversation]:
    return db.query(Conversation).filter(Conversation.id == conv_id).first()


def update_conversation(
    db: Session, conv: Conversation, **fields
) -> Conversation:
    for key, value in fields.items():
        if hasattr(conv, key):
            setattr(conv, key, value)
    db.commit()
    db.refresh(conv)
    return conv


def delete_conversation(db: Session, conv: Conversation) -> None:
    db.delete(conv)
    db.commit()


# ---- 消息 ----
def add_message(
    db: Session, conversation_id: str, role: str, content: str
) -> Message:
    msg = Message(conversation_id=conversation_id, role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def list_messages(db: Session, conversation_id: str) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def search_messages(db: Session, keyword: str) -> list[Message]:
    """跨会话搜索消息（简单 LIKE 匹配）。"""
    return (
        db.query(Message)
        .filter(Message.content.like(f"%{keyword}%"))
        .order_by(Message.created_at.desc())
        .limit(50)
        .all()
    )

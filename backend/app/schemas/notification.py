from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    category: str
    is_read: bool
    created_at: datetime


class UnreadCountOut(BaseModel):
    unread: int


class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: int | None
    actor_name: str | None
    action: str
    entity_type: str
    entity_id: int
    details: str | None
    timestamp: datetime

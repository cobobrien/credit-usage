from typing import List, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    id: int
    timestamp: str  # ISO 8601 format
    text: str
    report_id: Optional[int] = None


class Report(BaseModel):
    id: int
    name: str
    credit_cost: float


class Usage(BaseModel):
    message_id: int
    timestamp: str
    report_name: Optional[str] = None
    credits_used: float = Field(..., gt=0, description="The number of credits consumed by this message")


class UsageResponse(BaseModel):
    usage: List[Usage]

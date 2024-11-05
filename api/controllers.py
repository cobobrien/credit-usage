from fastapi import APIRouter, HTTPException

from api.models import Usage, UsageResponse
from services.calculate_message_cost import calculate_message_credits
from services.get_messages import get_messages

router = APIRouter()


@router.get("/usage", response_model=UsageResponse)
def get_usage_data():
    """Fetches usage data for the current billing period and calculates credits consumed."""
    try:
        usage_data = []

        for message in get_messages():
            report_name, credits_used = calculate_message_credits(message)
            usage_entry = Usage(
                message_id=message.id,
                timestamp=message.timestamp,
                report_name=report_name,
                credits_used=credits_used,
            )
            usage_data.append(usage_entry)
        return UsageResponse(usage=usage_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

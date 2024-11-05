from typing import List

import requests
from fastapi import HTTPException

from api.models import Message

MESSAGES_API_URL = "https://owpublic.blob.core.windows.net/tech-task/messages/current-period"


def get_messages() -> List[Message]:
    response = requests.get(MESSAGES_API_URL)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching message data")
    messages = [Message(**msg) for msg in response.json()["messages"]]
    return messages

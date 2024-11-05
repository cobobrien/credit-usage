import re
from typing import Optional, Tuple

import requests
from fastapi import HTTPException

from api.models import Message, Report

REPORT_API_URL_TEMPLATE = "https://owpublic.blob.core.windows.net/tech-task/reports/{id}"


def get_report(report_id: int) -> Optional[Report]:
    """Fetch the report cost from the report API."""
    response = requests.get(REPORT_API_URL_TEMPLATE.format(id=report_id))
    if response.status_code == 404:
        return None
    elif response.status_code == 200:
        return Report(**response.json())
    else:
        raise HTTPException(status_code=500, detail="Error fetching report data")


def calculate_word_cost(word: str) -> float:
    """Calculates the cost for a given word based on its length."""
    word_length = len(word)
    if word_length <= 3:
        return 0.1
    elif word_length <= 7:
        return 0.2
    else:
        return 0.3


def calculate_message_credits(message: Message) -> Tuple[Optional[str], float]:
    """Calculates the credits consumed by a message."""
    if message.report_id is not None:
        report = get_report(message.report_id)
        if report is not None:
            return (report.name, report.credit_cost)

    credits = 1.0
    credits += len(message.text) * 0.05

    words = re.findall(r"\b\w+\b", message.text)
    unique_words = set()
    word_cost = 0.0

    for word in words:
        unique_words.add(word)
        word_cost += calculate_word_cost(word)

    credits += word_cost

    if len(unique_words) == len(words):
        credits -= 2.0

    third_vowel_cost = 0.3 * sum(
        1 for idx, char in enumerate(message.text, 1) if idx % 3 == 0 and char.lower() in "aeiou"
    )
    credits += third_vowel_cost

    if len(message.text) > 100:
        credits += 5.0

    sanitized_text = re.sub(r"[^a-zA-Z0-9]", "", message.text).lower()
    if sanitized_text == sanitized_text[::-1]:
        credits *= 2

    return (None, round(max(credits, 1.0), 2))

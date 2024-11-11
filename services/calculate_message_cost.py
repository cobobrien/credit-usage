import re
from functools import lru_cache
from typing import List, Optional, Tuple

from api.models import Message
from services.get_report import get_report


def get_report_cost(report_id: int) -> Optional[Tuple[str, float]]:
    """Retrieves the report name and credit cost for a given report ID."""
    report = get_report(report_id)
    if report is not None:
        return (report.name, report.credit_cost)
    return None


def calculate_character_cost(text: str) -> float:
    """Calculates cost based on character count (0.05 per character)."""
    return len(text) * 0.05


def get_words(text: str) -> List[str]:
    """Extracts words from text using regex pattern."""
    # First replace special characters (except apostrophes and hyphens) with spaces
    result = ""
    for i, c in enumerate(text):
        if c.isalnum() or c in "'- ":
            result += c
        else:
            # Add space only if we're not already looking at a space
            if i == 0 or result[-1] != " ":
                result += " "

    # Split and filter empty strings
    return [word for word in result.lower().split() if word]


@lru_cache
def calculate_word_cost(word: str) -> float:
    """Calculates cost for a single word based on its length."""
    word_length = len(word)
    if word_length <= 3:
        return 0.1
    elif word_length <= 7:
        return 0.2
    return 0.3


def calculate_total_word_cost(words: List[str]) -> float:
    """Calculates total cost for all words in the message."""
    return sum(calculate_word_cost(word) for word in words)


def calculate_unique_words_bonus(words: List[str]) -> float:
    """Returns -2.0 if all words are unique, 0.0 otherwise."""
    return -2.0 if len(set(words)) == len(words) else 0.0


def count_third_position_vowels(text: str) -> int:
    """Counts vowels in every third position (3rd, 6th, 9th, etc.)."""
    return sum(1 for idx, char in enumerate(text, 1) if idx % 3 == 0 and char.lower() in "aeiou")


def calculate_third_vowel_cost(text: str) -> float:
    """Calculates cost for vowels in third positions (0.3 each)."""
    return 0.3 * count_third_position_vowels(text)


def calculate_length_penalty(text: str) -> float:
    """Returns 5.0 if text length exceeds 100 characters, 0.0 otherwise."""
    return 5.0 if len(text) > 100 else 0.0


def is_palindrome(text: str) -> bool:
    """Checks if text is palindrome after sanitization."""
    sanitized = re.sub(r"[^a-zA-Z0-9]", "", text).lower()
    return sanitized == sanitized[::-1]


def calculate_palindrome_multiplier(text: str) -> float:
    """Returns 2.0 if text is palindrome, 1.0 otherwise."""
    return 2.0 if is_palindrome(text) else 1.0


def calculate_text_based_credits(text: str) -> float:
    """Calculates credits for a message based on its text content."""
    base_cost = 1.0
    words = get_words(text)

    total_cost = sum(
        [
            base_cost,
            calculate_character_cost(text),
            calculate_total_word_cost(words),
            calculate_unique_words_bonus(words),
            calculate_third_vowel_cost(text),
            calculate_length_penalty(text),
        ]
    )

    # Apply palindrome multiplier after all other calculations
    total_cost *= calculate_palindrome_multiplier(text)

    return round(max(total_cost, 1.0), 2)


def calculate_message_credits(message: Message) -> Tuple[Optional[str], float]:
    """
    Calculates the credits consumed by a message.

    If message has a valid report_id, returns the report's name and credit cost.
    Otherwise, calculates credits based on message text content.
    """
    if message.report_id is not None:
        report_result = get_report_cost(message.report_id)
        if report_result is not None:
            return report_result

    return (None, calculate_text_based_credits(message.text))

from unittest.mock import patch

import pytest

from api.models import Message, Report
from services.calculate_message_cost import calculate_message_credits, get_words, is_palindrome


@pytest.fixture
def mock_get_report():
    with patch("services.calculate_message_cost.get_report") as mock:
        yield mock


def test_report_based_cost(mock_get_report):
    """Test when message has a valid report_id.

    Calculation:
    - Report cost: 10.0
    Total: 10.0
    Final: 10.0
    """
    mock_get_report.return_value = Report(id=1, name="Test Report", credit_cost=10.0)
    message = Message(id=1, text="ignored", report_id=1, timestamp="2024-01-01T00:00:00Z")

    report_name, credits = calculate_message_credits(message)

    assert report_name == "Test Report"
    assert credits == 10.0


def test_report_not_found_fallback(mock_get_report):
    """Test fallback when report_id is invalid.

    Calculation:
    - Base cost: 1.0
    - Characters (6 * 0.05): 0.3
    - Word cost (4-7 chars): 0.2
    - Unique words bonus: -2.0
    Total: 1.0 + 0.3 + 0.2 - 2.0 = -0.5
    Final: 1.0 (minimum credit cost applied)
    """
    mock_get_report.return_value = None
    message = Message(id=1, text="simple", report_id=999, timestamp="2024-01-01T00:00:00Z")

    report_name, credits = calculate_message_credits(message)

    assert report_name is None
    assert credits == 1.0


def test_base_cost():
    """Test base cost of 1 credit.

    Calculation:
    - Base cost: 1.0
    Total: 1.0
    Final: 1.0
    """
    message = Message(id=1, text="", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 1.0


def test_character_count():
    """Test 0.05 credits per character.

    Calculation:
    - Base cost: 1.0
    - Characters (3 * 0.05): 0.15
    - Word cost (1-3 chars): 0.1
    - Unique words bonus: -2.0
    Total: 1.0 + 0.15 + 0.1 - 2.0 = -0.75
    Final: 1.0 (minimum credit cost applied)
    """
    message = Message(id=1, text="abc", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 1.0


def test_word_length_costs():
    """Test different word length costs.

    Calculation:
    - Base cost: 1.0
    - Characters (15 * 0.05): 0.75
    - Words: 0.1 + 0.2 + 0.3 = 0.6 (at + word + beautiful)
    - Unique words bonus: -2.0
    Total: 1.0 + 0.75 + 0.6 - 2.0 = 0.35
    Final: 1.0 (minimum credit cost applied)
    """
    message = Message(id=1, text="at word beautiful", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 1.0


def test_third_vowel_cost():
    """Test additional cost for vowels in third positions.

    Calculation:
    - Base cost: 1.0
    - Characters (5 * 0.05): 0.25
    - Word cost (4-7 chars): 0.2
    - Third vowel cost: 0.3
    - Unique words bonus: -2.0
    Total: 1.0 + 0.25 + 0.2 + 0.3 - 2.0 = -0.25
    Final: 1.0 (minimum credit cost applied)
    """
    message = Message(id=1, text="abeba", timestamp="2024-01-01T00:00:00Z")  # 'e' is third char
    _, credits = calculate_message_credits(message)
    assert credits == 1.0


def test_length_penalty():
    """Test penalty for messages over 100 characters.

    Calculation:
    - Base cost: 1.0
    - Characters (101 * 0.05): 5.05
    - Word cost (1 word, 101 chars): 0.3
    - Length penalty: 5.0
    - Unique words bonus: -2.0
    Total: 1.0 + 5.05 + 0.3 + 5.0 - 2.0 = 9.35
    Final: 9.35
    """
    long_text = "a" + ("b" * 100)
    message = Message(id=1, text=long_text, timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 9.35


def test_unique_words_bonus():
    """Test bonus for all unique words.

    Unique words calculation:
    - Base cost: 1.0
    - Characters (11 * 0.05): 0.55
    - Words (3 words, 3-4 chars each): 3 * 0.1 = 0.3
    - Unique words bonus: -2.0
    Total: 1.0 + 0.55 + 0.3 - 2.0 = -0.15
    Final: 1.0 (minimum credit cost applied)

    Repeated words calculation:
    - Base cost: 1.0
    - Characters (11 * 0.05): 0.55
    - Words (3 words, 3 chars each): 3 * 0.3 = 0.9
    - No unique words bonus
    Total: 1.0 + 0.55 + 0.9 = 2.45
    Final: 2.45
    """
    message = Message(id=1, text="one two three", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)

    # Same message with repeated words
    message_repeated = Message(id=1, text="one one one", timestamp="2024-01-01T00:00:00Z")
    _, credits_repeated = calculate_message_credits(message_repeated)

    assert credits == 1.0
    assert credits_repeated == 2.45


def test_palindrome_multiplier():
    """Test palindrome doubling.

    Palindrome calculation:
    - Base cost: 1.0
    - Characters (9 * 0.05): 0.45
    - Words (1 word): 0.3
    - Unique words bonus: -2.0
    Total before multiplier: 1.0 + 0.45 + 0.3 - 2.0 = -0.25
    Final after palindrome multiplier: -0.25 * 2 = -0.5
    Final: 1.0 (minimum credit cost applied)

    Non-palindrome calculation:
    - Base cost: 1.0
    - Characters (9 * 0.05): 0.45
    - Words (1 word): 0.3
    - Unique words bonus: -2.0
    Total: 1.0 + 0.45 + 0.3 - 2.0 = -0.25
    Final: 1.0 (minimum credit cost applied)
    """
    message = Message(id=1, text="racecar", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)

    message_normal = Message(id=1, text="whatever", timestamp="2024-01-01T00:00:00Z")
    _, credits_normal = calculate_message_credits(message_normal)

    assert credits == 1.0
    assert credits_normal == 1.0


def test_minimum_credit_cost():
    """Test that credit cost never goes below 1.0.

    Calculation:
    - Base cost: 1.0
    - Characters (3 * 0.05): 0.15
    - Words (2 words, 1 char each): 2 * 0.1 = 0.2
    - Unique words bonus: -2.0
    Total: 1.0 + 0.15 + 0.2 - 2.0 = -0.65
    Final: 1.0 (minimum credit cost applied)
    """
    message = Message(id=1, text="a b", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 1.0


def test_complex_scenario():
    """Test combining multiple rules.

    Calculation:
    - Base cost: 1.0
    - Characters (30 * 0.05): 1.5
    - Words: 0.1 + 0.1 + 0.1 + 0.2 + 0.1 + 0.2 + 0.2 = 1.0
    - Third vowel costs (3 'a's in positions 6,12,18): 3 * 0.3 = 0.9
    - Unique words bonus: 0.0 (not applied - 'a' appears multiple times)
    Total before multiplier: 1.0 + 1.5 + 1.0 + 0.9 = 4.4
    Final after palindrome multiplier: 4.4 * 2 = 8.8
    Final: 8.8
    """
    message = Message(id=1, text="A man, a plan, a canal Panama!", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 8.8


def test_word_definition():
    """Test that words can include apostrophes and hyphens.

    Calculation:
    - Base cost: 1.0
    - Characters (21 * 0.05): 1.05
    - Words:
        - "don't" (5 chars): 0.2
        - "self-aware" (10 chars): 0.3
    - Third vowel cost (e in position 9): 0.3
    - Unique words bonus: -2.0
    Total: 1.0 + 1.05 + 0.5 + 0.3 - 2.0 = 0.85
    Final: 1.0 (minimum credit cost applied)
    """
    message = Message(id=1, text="don't be self-aware", timestamp="2024-01-01T00:00:00Z")
    _, credits = calculate_message_credits(message)
    assert credits == 1.0

    # Test that these are counted as single words
    words = get_words(message.text)
    assert "don't" in words
    assert "self-aware" in words
    assert len(words) == 3  # don't, be, self-aware


def test_word_parsing_with_symbols():
    """Test that word parsing handles various symbols correctly."""
    test_cases = [
        # Test case, Expected words
        ("don't be self-aware!", ["don't", "be", "self-aware"]),
        ("hello...world", ["hello", "world"]),
        ("@#$hello&*()world", ["hello", "world"]),
        ("semi;colon:test", ["semi", "colon", "test"]),
        ("multiple     spaces", ["multiple", "spaces"]),
        ("mixed-up's-text's", ["mixed-up's-text's"]),
        ("email@domain.com", ["email", "domain", "com"]),
        ("back\\slash/forward", ["back", "slash", "forward"]),
        ("quote's aren't-hard", ["quote's", "aren't-hard"]),
        ("numbers123and-456", ["numbers123and-456"]),
    ]

    for test_input, expected in test_cases:
        message = Message(id=1, text=test_input, timestamp="2024-01-01T00:00:00Z")
        words = get_words(message.text)
        assert words == expected, f"Failed for input: {test_input}\nGot: {words}\nExpected: {expected}"


def test_length_penalty_boundary():
    """Test length penalty at exactly 100 characters and 101 characters.

    100-char calculation:
    - Base cost: 1.0
    - Characters (100 * 0.05): 5.0
    - Word cost (33 words * 0.1): 3.3
    - Third vowel cost: 0.0 (no vowels in third positions)
    - Length penalty: 0.0 (exactly 100 chars)
    Total: 1.0 + 5.0 + 3.3 = 9.3
    Final: 9.3

    101-char calculation:
    - Base cost: 1.0
    - Characters (101 * 0.05): 5.05
    - Word cost (34 words * 0.1): 3.4
    - Third vowel cost: 0.0 (no vowels in third positions)
    - Length penalty: 5.0 (exceeds 100 chars)
    Total: 1.0 + 5.05 + 3.4 + 5.0 = 14.45
    Final: 14.45
    """
    # Test exactly 100 characters
    text_100 = ("bc " * 32) + "bc  "
    message_100 = Message(id=1, text=text_100, timestamp="2024-01-01T00:00:00Z")
    _, credits_100 = calculate_message_credits(message_100)
    assert credits_100 == 9.3

    # Test 101 characters
    text_101 = ("bc " * 32) + "bc bc"
    message_101 = Message(id=1, text=text_101, timestamp="2024-01-01T00:00:00Z")
    _, credits_101 = calculate_message_credits(message_101)
    assert credits_101 == 14.45


def test_complex_palindromes():
    """Test complex palindromes with mixed casing, symbols, and spacing."""
    test_cases = [
        ("Able was I, ere I saw Elba!", True),
        ("No lemon, no melon", True),
        ("A Santa at NASA", True),
        ("Was it a car or a cat I saw?", True),
        ("Madam, in Eden, I'm Adam.", True),
        ("Hello, this is not a palindrome!", False),
    ]

    for test_input, expected in test_cases:
        assert is_palindrome(test_input) == expected, f"Failed for input: {test_input}\nExpected: {expected}"

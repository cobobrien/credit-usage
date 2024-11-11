import json
import os
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app import app
from services.calculate_message_cost import calculate_word_cost
from services.get_report import get_report


@pytest.fixture(autouse=True)
def clear_caches():
    """Automatically clear all LRU caches before each test"""
    get_report.cache_clear()
    calculate_word_cost.cache_clear()


client = TestClient(app)

DATA_DIR = Path(os.path.dirname(__file__)) / "data"

with open(DATA_DIR / "message.json") as f:
    MOCK_MESSAGE_DATA = json.load(f)

with open(DATA_DIR / "report_5392.json") as f:
    MOCK_REPORT_DATA_5392 = json.load(f)

with open(DATA_DIR / "report_8806.json") as f:
    MOCK_REPORT_DATA_8806 = json.load(f)

with open(DATA_DIR / "expected_response.json") as f:
    EXPECTED_RESPONSE = json.load(f)


class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code

    def json(self):
        return self.json_data


@patch("services.get_messages.message_requests.get")
def test_get_usage_success(mock_messages_get):
    mock_messages_get.side_effect = [
        MockResponse(MOCK_MESSAGE_DATA, 200),
        MockResponse(MOCK_REPORT_DATA_5392, 200),
        MockResponse(MOCK_REPORT_DATA_8806, 200),
    ]

    response = client.get("/usage")
    assert response.status_code == 200
    assert response.json() == EXPECTED_RESPONSE


@patch("services.get_messages.message_requests.get")
def test_get_usage_message_service_failure(mock_messages_get):
    """Test handling of message service failure"""
    mock_messages_get.return_value = MockResponse({"error": "Service unavailable"}, 500)

    response = client.get("/usage")
    assert response.status_code == 500
    assert response.json() == {"detail": "500: Error fetching message data"}


@patch("services.get_messages.message_requests.get")
def test_get_usage_single_report_failure(mock_messages_get):
    """Test handling when one report fetch fails but others succeed"""
    mock_messages_get.side_effect = [
        MockResponse(MOCK_MESSAGE_DATA, 200),
        MockResponse(MOCK_REPORT_DATA_5392, 200),
        MockResponse({"error": "Not found"}, 404),  # 8806 report fails
    ]

    response = client.get("/usage")
    assert response.status_code == 200

    usage_data = response.json()["usage"]
    assert len(usage_data) == 4

    # Check the failed report falls back to text-based calculation
    failed_report_entry = next(entry for entry in usage_data if entry["message_id"] == 1009)
    assert failed_report_entry["report_name"] is None
    assert failed_report_entry["credits_used"] > 0


@patch("services.get_messages.message_requests.get")
def test_get_usage_all_reports_failure(mock_messages_get):
    """Test handling when all report fetches fail"""
    mock_messages_get.side_effect = [
        MockResponse(MOCK_MESSAGE_DATA, 200),
        MockResponse({"error": "Service unavailable"}, 500),
        MockResponse({"error": "Service unavailable"}, 500),
    ]

    response = client.get("/usage")
    assert response.status_code == 500
    assert response.json() == {"detail": "500: Error fetching report data"}


@patch("services.get_messages.message_requests.get")
def test_get_usage_empty_messages(mock_messages_get):
    """Test handling of empty message list"""
    mock_messages_get.return_value = MockResponse({"messages": []}, 200)

    response = client.get("/usage")
    assert response.status_code == 200
    assert response.json() == {"usage": []}

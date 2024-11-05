from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.models import Message
from app import app

client = TestClient(app)

MOCK_MESSAGES_RESPONSE = {
    "messages": [
        {
            "text": "Please generate a Short Lease Report for the client.",
            "timestamp": "2024-05-04T18:23:31.165Z",
            "report_id": 1124,
            "id": 1109,
        },
        {
            "text": "What is the lease term?",
            "timestamp": "2024-05-02T08:20:25.371Z",
            "id": 1056,
        },
    ]
}

MOCK_REPORT_RESPONSE = {"id": 1124, "name": "Short Lease Report", "credit_cost": 61}


@pytest.fixture
def mock_get_messages():
    with patch("api.controllers.get_messages") as mock_get:
        messages = [Message(**msg) for msg in MOCK_MESSAGES_RESPONSE["messages"]]
        mock_get.return_value = messages
        yield mock_get


@pytest.fixture
def mock_calculate_credits():
    with patch("api.controllers.calculate_message_credits") as mock_calc:

        def calc_side_effect(message):
            if hasattr(message, "report_id") and message.report_id == 1124:
                return "Short Lease Report", 61
            return "General Query", 1

        mock_calc.side_effect = calc_side_effect
        yield mock_calc


@pytest.fixture
def mock_services_with_error():
    with patch("api.controllers.get_messages") as mock_get:
        mock_get.side_effect = Exception("Service unavailable")
        yield mock_get


def test_get_usage_data_success(mock_get_messages, mock_calculate_credits):
    """Test successful retrieval of usage data"""
    response = client.get("/usage")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    assert data[0]["message_id"] == 1109
    assert data[0]["report_name"] == "Short Lease Report"
    assert data[0]["credits_used"] == 61

    assert data[1]["message_id"] == 1056
    assert data[1]["report_name"] == "General Query"
    assert data[1]["credits_used"] == 1


def test_get_usage_data_service_error(mock_services_with_error):
    """Test error handling when service throws an exception"""
    response = client.get("/usage")

    assert response.status_code == 500
    assert response.json()["detail"] == "Service unavailable"


def test_get_usage_data_empty_messages():
    """Test handling of empty message list"""
    with patch("api.controllers.get_messages") as mock_get:
        mock_get.return_value = []

        response = client.get("/usage")

        assert response.status_code == 200
        assert response.json() == []

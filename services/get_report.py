from functools import lru_cache
from typing import Optional

import requests as report_requests
from fastapi import HTTPException

from api.models import Report

REPORT_API_URL_TEMPLATE = "https://owpublic.blob.core.windows.net/tech-task/reports/{id}"


@lru_cache
def get_report(report_id: int) -> Optional[Report]:
    """Fetch the report cost from the report API."""
    response = report_requests.get(REPORT_API_URL_TEMPLATE.format(id=report_id))
    if response.status_code == 404:
        return None
    elif response.status_code == 200:
        return Report(**response.json())
    else:
        raise HTTPException(status_code=500, detail="Error fetching report data")

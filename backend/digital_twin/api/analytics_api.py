from fastapi import APIRouter
from ..services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

@router.post("/analytics/learning")
def analyze_learning(progress_data: list):
    return analytics_service.analyze(progress_data) 
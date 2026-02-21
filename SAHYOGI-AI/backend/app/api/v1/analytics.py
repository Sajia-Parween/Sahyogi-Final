from fastapi import APIRouter
from app.services.analytics_service import get_analytics_summary

router = APIRouter()


@router.get("/summary")
def analytics_summary():
    return get_analytics_summary()

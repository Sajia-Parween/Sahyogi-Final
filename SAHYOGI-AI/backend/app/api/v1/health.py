from fastapi import APIRouter
from app.models.api_response import success_response

router = APIRouter()


@router.get("/")
def health_check():
    return success_response({"status": "Sahyogi backend running"})


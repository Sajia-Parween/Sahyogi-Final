"""
IVR Intelligence API Router
Provides conversational query endpoint for the IVR system.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.ivr_intelligence import handle_ivr_query, explain_reasoning
from app.models.api_response import success_response, error_response

router = APIRouter()


class IVRQueryRequest(BaseModel):
    text: str
    session_data: Optional[dict] = None


class IVRExplainRequest(BaseModel):
    recommendation: dict


# ─── POST /query ───

@router.post("/query")
def ivr_query(request: IVRQueryRequest):
    """
    Handle a conversational IVR query.
    Detects intent, extracts entities, and returns layered voice response.
    """
    if not request.text or not request.text.strip():
        return error_response(
            "Please say or type your question",
            error="empty_input",
            status_code=400,
        )

    result = handle_ivr_query(request.text, request.session_data)
    return success_response(result, message="IVR query processed")


# ─── POST /explain ───

@router.post("/explain")
def ivr_explain(request: IVRExplainRequest):
    """
    Explain the reasoning behind a recommendation.
    Called when user asks 'why'.
    """
    explanation = explain_reasoning(request.recommendation)
    return success_response(
        {"explanation": explanation},
        message="Reasoning explained",
    )

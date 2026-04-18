"""
Supply Intelligence API Router
Endpoints for market prices, demand, prediction, and selling recommendations.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.supply_engine import (
    simulate_market_prices,
    simulate_buyer_demand,
    predict_price_trend,
    recommend_selling_strategy,
)
from app.models.api_response import success_response, error_response

router = APIRouter()


class RecommendRequest(BaseModel):
    crop: str
    quantity: int
    location: str
    storage_available: bool = False


# ─── GET /prices?crop=&location= ───

@router.get("/prices")
def get_prices(crop: str, location: str = "Sambalpur"):
    """Get simulated market prices across all selling channels."""
    if not crop or not crop.strip():
        return error_response("Crop name is required", error="missing_crop", status_code=400)

    prices = simulate_market_prices(crop, location)
    return success_response(prices, message=f"Market prices for {crop} in {location}")


# ─── GET /demand?crop= ───

@router.get("/demand")
def get_demand(crop: str):
    """Get simulated buyer demand for a crop."""
    if not crop or not crop.strip():
        return error_response("Crop name is required", error="missing_crop", status_code=400)

    demand = simulate_buyer_demand(crop)
    return success_response(demand, message=f"Buyer demand for {crop}")


# ─── GET /predict?crop= ───

@router.get("/predict")
def get_prediction(crop: str):
    """Get 3-day price trend prediction."""
    if not crop or not crop.strip():
        return error_response("Crop name is required", error="missing_crop", status_code=400)

    prediction = predict_price_trend(crop)
    return success_response(prediction, message=f"Price prediction for {crop}")


# ─── POST /recommend ───

@router.post("/recommend")
def get_recommendation(request: RecommendRequest):
    """
    Get AI-powered selling strategy recommendation.
    Uses scoring-based decision engine to recommend best selling approach.
    """
    if not request.crop or not request.crop.strip():
        return error_response("Crop name is required", error="missing_crop", status_code=400)

    if request.quantity <= 0:
        return error_response("Quantity must be positive", error="invalid_quantity", status_code=400)

    recommendation = recommend_selling_strategy({
        "crop": request.crop,
        "quantity": request.quantity,
        "location": request.location,
        "storage_available": request.storage_available,
    })

    return success_response(
        recommendation,
        message=f"Selling strategy for {request.quantity}kg {request.crop} in {request.location}"
    )

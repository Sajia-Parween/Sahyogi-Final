from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime

from app.services.supabase_service import (
    get_farmer_by_phone,
    get_soil_by_farmer_id
)

from app.core.simulation_engine import simulate_sell_decision
from app.core.advice_engine import generate_full_advice
from app.core.risk_engine import calculate_risk_and_sell_confidence
from app.core.market_projection import generate_market_projection

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[4]
MARKET_DIR = BASE_DIR / "data" / "market_prices"


def get_market_file(crop: str) -> str:
    """Resolve market CSV path dynamically based on crop."""
    crop_lower = crop.lower().strip()
    crop_file = MARKET_DIR / f"{crop_lower}_prices.csv"
    if crop_file.exists():
        return str(crop_file)
    return str(MARKET_DIR / "wheat_prices.csv")


class SimulationRequest(BaseModel):
    phone: str
    sell_after_days: int


@router.post("/")
def simulate_sell(request: SimulationRequest):

    # 1️⃣ Fetch Farmer
    farmer = get_farmer_by_phone(request.phone)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # 2️⃣ Fetch Soil Data
    soil = get_soil_by_farmer_id(farmer["id"])

    soil_data = {
        "nitrogen": soil.get("nitrogen") if soil else None,
        "phosphorus": soil.get("phosphorus") if soil else None,
        "potassium": soil.get("potassium") if soil else None,
        "ph": soil.get("ph") if soil else None,
    }

    # 3️⃣ Convert sowing_date
    sowing_date = datetime.strptime(
        farmer["sowing_date"], "%Y-%m-%d"
    ).date()

    # 4️⃣ Resolve crop-specific market file
    market_file = get_market_file(farmer["crop"])

    # 5️⃣ Generate Advisory
    structured_advice = generate_full_advice(
        crop=farmer["crop"],
        sowing_date=sowing_date,
        soil_data=soil_data,
        market_file_path=market_file
    )

    # 6️⃣ Generate Market Projection
    market_projection = generate_market_projection(market_file)

    # 7️⃣ Calculate Base Risk Confidence
    risk = calculate_risk_and_sell_confidence(
        structured_advice,
        market_projection
    )

    base_confidence = risk["sell_confidence"]

    # 8️⃣ Run Monte Carlo Simulation
    simulation_result = simulate_sell_decision(
        csv_path=market_file,
        sell_after_days=request.sell_after_days,
        base_confidence=base_confidence
    )

    return {
        "farmer": farmer["name"],
        "sell_after_days": request.sell_after_days,
        "base_risk_confidence": base_confidence,
        "simulation_result": simulation_result
    }

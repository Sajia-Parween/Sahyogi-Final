from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path

# Core engines
from app.core.advice_engine import generate_full_advice
from app.core.language import format_advice_response
from app.core.market_projection import generate_market_projection
from app.core.risk_engine import calculate_risk_and_sell_confidence, volatility_alert
from app.core.mandi_engine import mandi_price_comparison, fair_price_indicator
from app.core.strategy_engine import generate_partial_sell_strategy

# AI
from app.ai.tts import generate_audio
from app.ai.gemini_explainer import enhance_advisory

# Services
from app.services.supabase_service import (
    get_farmer_by_phone,
    get_soil_by_farmer_id
)
from app.services.call_logger import log_call


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[4]
MARKET_FILE = BASE_DIR / "data" / "market_prices" / "wheat_prices.csv"
MULTI_MANDI_FILE = BASE_DIR / "data" / "market_prices" / "wheat_multi_mandi.csv"


class CallRequest(BaseModel):
    phone: str


@router.post("/")
def simulate_call(request: CallRequest):

    # 🔹 1️⃣ Fetch Farmer
    farmer = get_farmer_by_phone(request.phone)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # 🔹 2️⃣ Fetch Soil
    soil = get_soil_by_farmer_id(farmer["id"])

    soil_data = {
        "nitrogen": soil.get("nitrogen") if soil else None,
        "phosphorus": soil.get("phosphorus") if soil else None,
        "potassium": soil.get("potassium") if soil else None,
        "ph": soil.get("ph") if soil else None,
    }

    # 🔹 3️⃣ Generate Structured Advisory
    sowing_date = datetime.strptime(
        farmer["sowing_date"], "%Y-%m-%d"
    ).date()

    structured_advice = generate_full_advice(
        crop=farmer["crop"],
        sowing_date=sowing_date,
        soil_data=soil_data,
        market_file_path=str(MARKET_FILE)
    )

    # 🔹 4️⃣ Market Projection
    market_projection = generate_market_projection(str(MARKET_FILE))

    # 🔹 5️⃣ Advanced Risk Engine
    risk_analysis = calculate_risk_and_sell_confidence(
        structured_advice,
        market_projection
    )

    # 🔹 6️⃣ Mandi Comparison
    mandi_comparison = mandi_price_comparison(
        str(MULTI_MANDI_FILE),
        "Sambalpur"
    )

    # 🔹 7️⃣ Fair Price Indicator
    fair_price = fair_price_indicator(
        current_price=market_projection["current_price"],
        historical_avg=market_projection["moving_average_7"],
        msp=2200  # You can store MSP per crop later
    )

    # 🔹 8️⃣ Partial Selling Strategy
    partial_strategy = generate_partial_sell_strategy(
        risk_analysis["risk_score"]
    )

    # 🔹 9️⃣ Volatility Alert
    volatility_warning = volatility_alert(
        market_projection["volatility"]
    )

    # 🔹 🔟 Language Layer
    language = farmer.get("language", "en")

    narrative = format_advice_response(
        structured_advice,
        language=language
    )

    # 🔹 1️⃣1️⃣ Gemini Enhancement (Optional AI polish)
    enhanced_text = enhance_advisory(structured_advice, language)
    if enhanced_text:
        narrative = enhanced_text

    # 🔹 1️⃣2️⃣ Generate Audio
    audio_path = generate_audio(
        narrative,
        language
    )

    filename = Path(audio_path).name
    audio_url = f"/api/v1/audio/{filename}"

    # 🔹 1️⃣3️⃣ Log Call
    log_call(
        farmer_id=farmer["id"],
        phone=farmer["phone"],
        language=language,
        crop=farmer["crop"],
        crop_stage=structured_advice["crop_stage"],
        market_trend=structured_advice["market_trend"],
        audio_path=audio_url,
        advisory_snapshot=structured_advice
    )

    # 🔹 1️⃣4️⃣ Final Response
    return {
        "message": "Call simulated successfully",
        "farmer": farmer["name"],
        "audio_file": audio_url,
        "enhanced_advisory": narrative,
        "summary": structured_advice,
        "market_projection": market_projection,
        "risk_analysis": risk_analysis,
        "mandi_comparison": mandi_comparison,
        "fair_price_indicator": fair_price,
        "partial_sell_strategy": partial_strategy,
        "volatility_alert": volatility_warning
    }

from fastapi import APIRouter
from fastapi.responses import FileResponse
from app.models.api_response import success_response, error_response
from app.core.advice_engine import generate_full_advice
from app.core.language import format_advice_response
from app.services.supabase_service import (
    get_farmer_by_phone,
    get_soil_by_farmer_id
)
from app.ai.tts import generate_audio
from pathlib import Path
from datetime import datetime

router = APIRouter()

# Resolve base directory safely
BASE_DIR = Path(__file__).resolve().parents[4]
MARKET_FILE = BASE_DIR / "data" / "market_prices" / "wheat_prices.csv"


@router.get("/{phone}")
def get_advice(phone: str):

    farmer = get_farmer_by_phone(phone)

    if not farmer:
        return error_response("Farmer not found", error="not_found", status_code=404)

    soil = get_soil_by_farmer_id(farmer["id"])

    soil_data = {
        "nitrogen": soil.get("nitrogen") if soil else None,
        "phosphorus": soil.get("phosphorus") if soil else None,
        "potassium": soil.get("potassium") if soil else None,
        "ph": soil.get("ph") if soil else None,
    }

    sowing_date = datetime.strptime(
        farmer["sowing_date"], "%Y-%m-%d"
    ).date()

    structured_advice = generate_full_advice(
        crop=farmer["crop"],
        sowing_date=sowing_date,
        soil_data=soil_data,
        market_file_path=str(MARKET_FILE)
    )

    narrative = format_advice_response(
        structured_advice,
        language=farmer.get("language", "en")
    )

    return success_response({
        "farmer": farmer["name"],
        "structured": structured_advice,
        "narrative": narrative
    })


# 🔊 NEW AUDIO ENDPOINT
@router.get("/{phone}/audio")
def get_advice_audio(phone: str):

    farmer = get_farmer_by_phone(phone)

    if not farmer:
        return error_response("Farmer not found", error="not_found", status_code=404)

    soil = get_soil_by_farmer_id(farmer["id"])

    soil_data = {
        "nitrogen": soil.get("nitrogen") if soil else None,
        "phosphorus": soil.get("phosphorus") if soil else None,
        "potassium": soil.get("potassium") if soil else None,
        "ph": soil.get("ph") if soil else None,
    }

    sowing_date = datetime.strptime(
        farmer["sowing_date"], "%Y-%m-%d"
    ).date()

    structured_advice = generate_full_advice(
        crop=farmer["crop"],
        sowing_date=sowing_date,
        soil_data=soil_data,
        market_file_path=str(MARKET_FILE)
    )

    narrative = format_advice_response(
        structured_advice,
        language=farmer.get("language", "en")
    )

    audio_path = generate_audio(
        narrative,
        farmer.get("language", "en")
    )

    return FileResponse(audio_path, media_type="audio/mpeg")

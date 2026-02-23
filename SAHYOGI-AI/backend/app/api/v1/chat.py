from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path

from app.services.supabase_service import (
    get_farmer_by_phone,
    get_soil_by_farmer_id
)
from app.core.advice_engine import generate_full_advice
from app.core.market_projection import generate_market_projection
from app.ai.gemini_chat import chat_with_context
from app.ai.tts import generate_audio
from app.models.api_response import success_response, error_response


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[4]
MARKET_FILE = BASE_DIR / "data" / "market_prices" / "wheat_prices.csv"


class ChatRequest(BaseModel):
    phone: str
    question: str


@router.post("/")
def chat_with_farmer(request: ChatRequest):

    # 1️⃣ Fetch farmer
    farmer = get_farmer_by_phone(request.phone)

    if not farmer:
        return error_response(
            message="Farmer not found",
            error="not_found",
            status_code=404
        )

    # 2️⃣ Fetch soil data
    soil = get_soil_by_farmer_id(farmer["id"])

    soil_data = {
        "nitrogen": soil.get("nitrogen") if soil else None,
        "phosphorus": soil.get("phosphorus") if soil else None,
        "potassium": soil.get("potassium") if soil else None,
        "ph": soil.get("ph") if soil else None,
    }

    # 3️⃣ Convert sowing date
    sowing_date = datetime.strptime(
        farmer["sowing_date"], "%Y-%m-%d"
    ).date()

    # 4️⃣ Generate structured advisory
    structured_advice = generate_full_advice(
        crop=farmer["crop"],
        sowing_date=sowing_date,
        soil_data=soil_data,
        market_file_path=str(MARKET_FILE)
    )

    # 5️⃣ Generate market projection data for richer context
    market_data = None
    try:
        market_data = generate_market_projection(str(MARKET_FILE))
    except Exception as e:
        print(f"Market projection failed (non-critical): {e}")

    # 6️⃣ Farmer info for personalization
    farmer_info = {
        "name": farmer.get("name", "N/A"),
        "crop": farmer.get("crop", "N/A"),
        "district": farmer.get("district", "N/A"),
        "sowing_date": farmer.get("sowing_date", "N/A"),
    }

    # 7️⃣ AI Chat Response with enriched context
    language = farmer.get("language", "en")

    response_text = chat_with_context(
        structured_advice=structured_advice,
        question=request.question,
        language=language,
        market_data=market_data,
        farmer_info=farmer_info,
    )

    # 8️⃣ Generate Audio (non-blocking — chat works even if TTS fails)
    audio_url = None
    try:
        audio_path = generate_audio(response_text, language)
        if audio_path:
            filename = Path(audio_path).name
            audio_url = f"/api/v1/audio/{filename}"
    except Exception as e:
        print(f"Audio generation failed: {str(e)}")

    # 9️⃣ Clean API Response
    return success_response(
        message="Chat response generated successfully",
        data={
            "farmer": farmer["name"],
            "question": request.question,
            "text_response": response_text,
            "audio_file": audio_url
        }
    )


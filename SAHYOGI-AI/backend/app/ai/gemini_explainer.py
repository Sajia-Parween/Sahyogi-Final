import os
from typing import Optional
from google import genai


# Initialize Gemini client safely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = None


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "or": "Odia (ଓଡ଼ିଆ)",
}


def enhance_advisory(structured_advice: dict, language: str = "en") -> Optional[str]:
    """
    Enhances structured advisory using Gemini.
    If Gemini fails for ANY reason, returns None.
    This guarantees backend stability.
    """

    # 🚨 If client not initialized, skip enhancement
    if not client:
        return None

    # Resolve full language name for clear Gemini instructions
    lang_name = LANGUAGE_NAMES.get(language, "English")

    try:
        crop_stage = structured_advice.get("crop_stage")
        days = structured_advice.get("days_since_sowing")
        soil_advice = structured_advice.get("soil_advice", [])
        market_trend = structured_advice.get("market_trend")
        market_advice = structured_advice.get("market_advice")

        context_prompt = f"""
You are an agricultural advisory assistant.

Farmer data:
- Crop stage: {crop_stage}
- Days since sowing: {days}
- Soil advice: {soil_advice}
- Market trend: {market_trend}
- Market advice: {market_advice}

You MUST respond entirely in {lang_name}. Use the native script of that language.

Generate a practical, easy-to-understand advisory message.
Keep it structured and farmer-friendly.
Do not use markdown formatting.
"""

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=context_prompt
        )

        if not response or not response.text:
            return None

        clean_text = response.text.strip().replace("*", "").replace("#", "")
        return clean_text

    except Exception as e:
        # 🚨 NEVER crash backend because of Gemini
        print("Gemini enhancement failed:", str(e))
        return None

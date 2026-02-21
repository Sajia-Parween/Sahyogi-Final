import os
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)


def chat_with_context(structured_advice: dict, question: str, language: str = "en"):

    context_prompt = f"""
You are an AI agricultural assistant helping a farmer.

Here is the structured advisory data:
Crop Stage: {structured_advice.get("crop_stage")}
Days Since Sowing: {structured_advice.get("days_since_sowing")}
Soil Advice: {structured_advice.get("soil_advice")}
Market Trend: {structured_advice.get("market_trend")}
Market Advice: {structured_advice.get("market_advice")}

Farmer Question:
{question}

Respond clearly and simply in {language}.
Keep it practical and action-oriented.
Do not hallucinate facts.
Only base response on given data.
"""

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=context_prompt
    )

    return response.text

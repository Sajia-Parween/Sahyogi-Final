import os
import json
from typing import Optional
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = None


def analyze_crop_disease(image_bytes: bytes, language: str = "en") -> Optional[dict]:
    """
    Analyze a crop/leaf image using Gemini Vision to detect diseases.
    Returns structured disease information or None if analysis fails.
    """

    if not client:
        return None

    try:
        prompt = f"""You are an expert agricultural plant pathologist.

Analyze this crop/leaf image and identify any disease or health issue.

Respond ONLY in valid JSON format with these exact keys:
{{
    "disease_name": "Name of the disease (or 'Healthy' if no disease)",
    "confidence": "High / Medium / Low",
    "severity": "Severe / Moderate / Mild / None",
    "affected_part": "Which part of the plant is affected",
    "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
    "causes": ["cause 1", "cause 2"],
    "remedies": ["remedy 1", "remedy 2", "remedy 3"],
    "prevention": ["prevention tip 1", "prevention tip 2"],
    "recommended_pesticide": "Name of recommended pesticide or 'Not required'",
    "urgency": "Immediate action needed / Monitor closely / No action needed"
}}

Language for all text values: {language}
Be practical and farmer-friendly in your recommendations.
Do NOT wrap the JSON in markdown code blocks. Return ONLY the raw JSON."""

        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg"
        )

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[prompt, image_part]
        )

        if not response or not response.text:
            return None

        # Clean response text - remove markdown code blocks if present
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        result = json.loads(text)
        return result

    except Exception as e:
        print(f"Gemini Vision analysis failed: {str(e)}")
        return None

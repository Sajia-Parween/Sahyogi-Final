import os
import json
import time
from typing import Optional, Union
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = None

MAX_RETRIES = 3
RETRY_DELAYS = [2, 4, 8]  # Exponential backoff (seconds)


def analyze_crop_disease(image_bytes: bytes, language: str = "en") -> Union[dict, str, None]:
    """
    Analyze a crop/leaf image using Gemini Vision to detect diseases.
    Returns:
      - dict: structured disease info on success
      - str: error message if a retryable/known error occurs
      - None: if client not configured
    """

    if not client:
        return None

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

    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt, image_part]
            )

            if not response or not response.text:
                return "AI model returned an empty response. Please try again."

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
            error_str = str(e)
            last_error = error_str

            # Check if it's a retryable error (503 overloaded, 429 rate limit)
            is_retryable = any(code in error_str for code in ["503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "overloaded", "high demand"])

            if is_retryable and attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAYS[attempt]
                print(f"Gemini Vision retry {attempt + 1}/{MAX_RETRIES} after {wait_time}s — {error_str[:80]}")
                time.sleep(wait_time)
                continue
            else:
                print(f"Gemini Vision analysis failed (attempt {attempt + 1}): {error_str}")
                break

    # Return user-friendly error message based on error type
    if last_error and any(code in last_error for code in ["503", "UNAVAILABLE", "high demand"]):
        return "The AI service is experiencing high demand right now. Please try again in a minute."
    elif last_error and any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
        return "Too many requests. Please wait a moment and try again."
    else:
        return "Could not analyze the image. Please try again with a clearer photo."

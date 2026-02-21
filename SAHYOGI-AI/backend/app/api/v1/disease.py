from fastapi import APIRouter, UploadFile, File, Form
from app.ai.gemini_vision import analyze_crop_disease
from app.models.api_response import success_response, error_response

router = APIRouter()


@router.post("/detect")
async def detect_crop_disease(
    image: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Upload a crop/leaf image to detect diseases using Gemini Vision AI.
    Returns disease name, severity, symptoms, remedies, and prevention tips.
    """

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if image.content_type not in allowed_types:
        return error_response(
            message="Invalid file type. Please upload a JPEG, PNG, or WebP image.",
            error="invalid_file_type",
            status_code=400
        )

    # Read image bytes
    image_bytes = await image.read()

    # Validate file size (max 10MB)
    if len(image_bytes) > 10 * 1024 * 1024:
        return error_response(
            message="Image too large. Maximum size is 10MB.",
            error="file_too_large",
            status_code=400
        )

    # Analyze with Gemini Vision
    result = analyze_crop_disease(image_bytes, language)

    if not result:
        return error_response(
            message="Could not analyze the image. Please try again with a clearer photo.",
            error="analysis_failed",
            status_code=500
        )

    return success_response(
        message="Disease analysis completed successfully",
        data=result
    )

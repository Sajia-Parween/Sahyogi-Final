from fastapi import APIRouter
from datetime import datetime

from app.services.supabase_service import get_farmer_by_phone
from app.core.crop_calendar import generate_crop_calendar
from app.models.api_response import success_response, error_response

router = APIRouter()


@router.get("/{phone}")
def get_crop_calendar(phone: str):
    """
    Get a personalized crop calendar for a farmer based on their
    crop type and sowing date.
    """

    # Fetch farmer data
    farmer = get_farmer_by_phone(phone)

    if not farmer:
        return error_response(
            message="Farmer not found",
            error="not_found",
            status_code=404
        )

    # Parse sowing date
    try:
        sowing_date = datetime.strptime(
            farmer["sowing_date"], "%Y-%m-%d"
        ).date()
    except (KeyError, ValueError):
        return error_response(
            message="Invalid or missing sowing date for this farmer",
            error="invalid_data",
            status_code=400
        )

    # Generate calendar
    crop = farmer.get("crop", "wheat")
    calendar = generate_crop_calendar(crop, sowing_date)

    # Find current stage info
    current_stage = next(
        (stage for stage in calendar if stage["is_current"]),
        None
    )

    return success_response(
        message="Crop calendar generated successfully",
        data={
            "farmer": farmer["name"],
            "crop": crop,
            "sowing_date": farmer["sowing_date"],
            "current_stage": current_stage,
            "calendar": calendar,
            "total_stages": len(calendar)
        }
    )

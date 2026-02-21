from datetime import date
from typing import Dict


# For MVP, we support only Wheat
CROP_STAGES = {
    "wheat": [
        {"stage": "Sowing", "start_day": 0, "end_day": 7},
        {"stage": "Germination", "start_day": 8, "end_day": 21},
        {"stage": "Tillering", "start_day": 22, "end_day": 45},
        {"stage": "Flowering", "start_day": 46, "end_day": 75},
        {"stage": "Maturity", "start_day": 76, "end_day": 110},
        {"stage": "Harvest", "start_day": 111, "end_day": 130},
    ]
}


def calculate_days_since_sowing(sowing_date: date) -> int:
    """Calculate number of days since sowing."""
    today = date.today()
    delta = today - sowing_date
    return delta.days


def get_crop_stage(crop: str, sowing_date: date) -> Dict:
    """
    Determine current crop stage based on days since sowing.
    """
    crop = crop.lower()

    if crop not in CROP_STAGES:
        raise ValueError(f"Unsupported crop: {crop}")

    days = calculate_days_since_sowing(sowing_date)

    for stage_info in CROP_STAGES[crop]:
        if stage_info["start_day"] <= days <= stage_info["end_day"]:
            return {
                "stage": stage_info["stage"],
                "days_since_sowing": days
            }

    return {
        "stage": "Unknown",
        "days_since_sowing": days
    }

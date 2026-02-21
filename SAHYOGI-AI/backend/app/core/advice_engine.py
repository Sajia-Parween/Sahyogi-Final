from datetime import date
from typing import Dict

from app.core.crop_engine import get_crop_stage
from app.core.soil_rules import generate_soil_advisory
from app.core.market_trends import load_market_prices, analyze_market_trend


def generate_full_advice(
    crop: str,
    sowing_date: date,
    soil_data: Dict,
    market_file_path: str
) -> Dict:
    """
    Orchestrates all advisory engines and returns structured output.
    """

    # 1️⃣ Crop Stage
    crop_info = get_crop_stage(crop, sowing_date)
    current_stage = crop_info["stage"]

    # 2️⃣ Soil Advisory
    soil_advice = generate_soil_advisory(soil_data, current_stage)

    # 3️⃣ Market Advisory
    prices = load_market_prices(market_file_path)
    market_info = analyze_market_trend(prices)

    # 4️⃣ Combine Output
    return {
        "crop_stage": current_stage,
        "days_since_sowing": crop_info["days_since_sowing"],
        "soil_advice": soil_advice,
        "market_trend": market_info["trend"],
        "market_advice": market_info["advice"]
    }

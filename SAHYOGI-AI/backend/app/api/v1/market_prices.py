"""
Multi-crop market prices endpoint.
Returns current prices, trends, and changes for all available crops.
"""
from fastapi import APIRouter
from pathlib import Path

from app.core.market_projection import generate_market_projection

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[4]
MARKET_DIR = BASE_DIR / "data" / "market_prices"

# All supported crops
SUPPORTED_CROPS = ["wheat", "rice", "maize", "cotton", "sugarcane"]

CROP_UNITS = {
    "wheat": "Per Quintal",
    "rice": "Per Quintal",
    "maize": "Per Quintal",
    "cotton": "Per Quintal",
    "sugarcane": "Per Quintal",
}


@router.get("/all")
def get_all_market_prices():
    """Return current prices and trends for all available crops."""
    results = []

    for crop in SUPPORTED_CROPS:
        csv_path = MARKET_DIR / f"{crop}_prices.csv"
        if not csv_path.exists():
            continue

        try:
            projection = generate_market_projection(str(csv_path))

            current_price = projection["current_price"]
            prev_price = projection["previous_price"]
            daily_change = projection["daily_change_percent"]
            trend = projection["trend_direction"]
            percent_7d = projection["percent_change_7_days"]

            results.append({
                "crop": crop.capitalize(),
                "price": current_price,
                "previous_price": prev_price,
                "daily_change_percent": daily_change,
                "trend": trend,
                "projection_7d_percent": percent_7d,
                "unit": CROP_UNITS.get(crop, "Per Quintal"),
            })
        except Exception:
            continue

    return {"crops": results}

from typing import Dict
from app.core.market_projection import load_market_data
import numpy as np


def simulate_sell_decision(
    csv_path: str,
    sell_after_days: int,
    base_confidence: float
) -> Dict:

    df = load_market_data(csv_path)

    prices = df["price"].values
    x = np.arange(len(prices))

    slope, intercept = np.polyfit(x, prices, 1)

    current_price = float(prices[-1])

    future_x = len(prices) + sell_after_days
    projected_price = float(slope * future_x + intercept)

    percent_change = ((projected_price - current_price) / current_price) * 100
    price_difference = projected_price - current_price

    # 🔥 Unified Confidence Adjustment
    projection_adjustment = percent_change * 0.8
    adjusted_confidence = base_confidence + projection_adjustment

    adjusted_confidence = max(0, min(100, adjusted_confidence))

    if percent_change > 5:
        recommendation = f"Waiting {sell_after_days} days may significantly increase profit"
    elif percent_change > 2:
        recommendation = f"Waiting {sell_after_days} days may moderately increase profit"
    elif percent_change > 0:
        recommendation = f"Slight gain expected if waiting {sell_after_days} days"
    else:
        recommendation = "Selling now may be safer due to downward projection"

    return {
        "current_price": round(current_price, 2),
        "projected_price": round(projected_price, 2),
        "expected_profit_change_percent": round(percent_change, 2),
        "price_difference": round(price_difference, 2),
        "base_confidence": round(base_confidence, 2),
        "projection_adjustment": round(projection_adjustment, 2),
        "adjusted_confidence": round(adjusted_confidence, 2),
        "recommendation": recommendation
    }

def simulate_with_storage_cost(csv_path: str, days: int, storage_cost_per_day: float):

    from app.core.market_projection import generate_market_projection

    projection = generate_market_projection(csv_path)

    current_price = projection["current_price"]
    projected_price = projection["projection_7_days"]

    storage_cost = storage_cost_per_day * days

    adjusted_projected = projected_price - storage_cost

    profit_change = ((adjusted_projected - current_price) / current_price) * 100

    return {
        "current_price": current_price,
        "projected_price_after_storage": round(adjusted_projected, 2),
        "storage_cost_total": round(storage_cost, 2),
        "net_profit_percent": round(profit_change, 2)
    }


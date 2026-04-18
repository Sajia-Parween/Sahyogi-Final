"""
Supply Intelligence Engine — Core Decision Layer
Provides market simulation, demand analysis, price prediction, and
scoring-based selling strategy recommendations.

This is the brain of Sahyogi's decision intelligence system.
"""

import random
import hashlib
from typing import Optional


# ─── Constants ───

CROP_BASE_PRICES = {
    "tomato": 15, "wheat": 22, "rice": 25, "maize": 18,
    "cotton": 35, "sugarcane": 12, "onion": 20, "potato": 14,
    "mustard": 30, "soybean": 28, "groundnut": 32, "chilli": 26,
}

BUYER_NAMES = [
    "Sambalpur Agri Traders", "GreenHarvest Exports", "Odisha FreshMart",
    "KisanDirect Pvt Ltd", "FarmLink Solutions", "Bargarh Crop Traders",
    "NatureFresh Wholesale", "AgriConnect Co.", "HarvestPro Industries",
    "RuralMart Distributors",
]

BUYER_SPECIALTIES = {
    "Sambalpur Agri Traders": "Local market specialist",
    "GreenHarvest Exports": "Export-grade produce buyer",
    "Odisha FreshMart": "Retail chain supplier",
    "KisanDirect Pvt Ltd": "Direct-to-consumer platform",
    "FarmLink Solutions": "Contract farming partner",
    "Bargarh Crop Traders": "Bulk wholesale buyer",
    "NatureFresh Wholesale": "Organic produce premium buyer",
    "AgriConnect Co.": "B2B marketplace aggregator",
    "HarvestPro Industries": "Processing unit supplier",
    "RuralMart Distributors": "Regional distribution network",
}

# Scoring weights for decision engine
WEIGHTS = {
    "price": 0.40,
    "reliability": 0.20,
    "urgency": 0.15,
    "distance": 0.15,
    "payment_speed": 0.10,
}


# ─── Seeded Random Helpers ───

def _seed_from(text: str) -> int:
    """Generate a deterministic seed from text for semi-consistent results."""
    return int(hashlib.md5(text.encode()).hexdigest()[:8], 16)


def _seeded_random(seed: int, min_val: float, max_val: float) -> float:
    """Return a seeded random float in [min_val, max_val]."""
    rng = random.Random(seed)
    return round(rng.uniform(min_val, max_val), 2)


def _seeded_int(seed: int, min_val: int, max_val: int) -> int:
    rng = random.Random(seed)
    return rng.randint(min_val, max_val)


def _get_base_price(crop: str) -> float:
    """Get base price for a crop, defaulting to 20 if unknown."""
    return CROP_BASE_PRICES.get(crop.lower().strip(), 20)


# ─── A. Market Price Simulation ───

def simulate_market_prices(crop: str, location: str) -> dict:
    """
    Simulate current market prices across all selling channels.

    Returns mandi price, PACS price, and a list of buyers with
    rich attributes (reliability, payment speed, past transactions).
    """
    crop_lower = crop.lower().strip()
    loc_lower = location.lower().strip()
    base = _get_base_price(crop_lower)
    seed = _seed_from(f"{crop_lower}_{loc_lower}")
    rng = random.Random(seed)

    # Mandi price: base ± 30%
    mandi_price = round(base * rng.uniform(0.85, 1.30), 2)

    # PACS price: typically 5–15% below mandi (govt procurement)
    pacs_price = round(mandi_price * rng.uniform(0.85, 0.95), 2)

    # Generate 4–6 buyers with rich attributes
    num_buyers = rng.randint(4, 6)
    buyers = []

    for i in range(num_buyers):
        buyer_seed = seed + i + 1
        buyer_rng = random.Random(buyer_seed)
        buyer_name = BUYER_NAMES[i % len(BUYER_NAMES)]

        # Price varies ±25% around base, some buyers pay premium
        price_per_kg = round(base * buyer_rng.uniform(0.80, 1.35), 2)
        distance_km = round(buyer_rng.uniform(2, 45), 1)
        reliability_score = round(buyer_rng.uniform(3.0, 5.0), 1)
        payment_days = buyer_rng.choice([0, 1, 3, 7, 14])
        past_transactions = buyer_rng.randint(5, 200)

        payment_speed = (
            "instant" if payment_days == 0
            else "next_day" if payment_days == 1
            else "3_days" if payment_days == 3
            else "weekly" if payment_days == 7
            else "biweekly"
        )

        buyers.append({
            "id": f"buyer_{crop_lower}_{i + 1:03d}",
            "name": buyer_name,
            "specialty": BUYER_SPECIALTIES.get(buyer_name, "General buyer"),
            "price_per_kg": price_per_kg,
            "distance_km": distance_km,
            "reliability_score": reliability_score,
            "payment_speed": payment_speed,
            "payment_days": payment_days,
            "past_transactions": past_transactions,
        })

    # Sort by price descending
    buyers.sort(key=lambda b: b["price_per_kg"], reverse=True)

    return {
        "crop": crop,
        "location": location,
        "mandi_price": mandi_price,
        "pacs_price": pacs_price,
        "buyers": buyers,
    }


# ─── B. Buyer Demand Simulation ───

def simulate_buyer_demand(crop: str) -> list[dict]:
    """
    Simulate buyer demand for a crop.
    Returns demand quantity and urgency per buyer.
    """
    crop_lower = crop.lower().strip()
    seed = _seed_from(f"demand_{crop_lower}")
    rng = random.Random(seed)

    num_buyers = rng.randint(3, 6)
    demand = []

    for i in range(num_buyers):
        buyer_rng = random.Random(seed + i + 100)
        urgency_val = buyer_rng.random()
        urgency = (
            "high" if urgency_val > 0.7
            else "medium" if urgency_val > 0.35
            else "low"
        )
        demand.append({
            "buyer_id": f"buyer_{crop_lower}_{i + 1:03d}",
            "buyer_name": BUYER_NAMES[i % len(BUYER_NAMES)],
            "demand_quantity": buyer_rng.randint(50, 500),
            "urgency": urgency,
            "willing_to_collect": buyer_rng.choice([True, False]),
        })

    return demand


# ─── C. Price Trend Prediction ───

def predict_price_trend(crop: str) -> dict:
    """
    Predict 3-day price trend using simulated data.
    Returns forecast array and trend direction.
    """
    crop_lower = crop.lower().strip()
    base = _get_base_price(crop_lower)
    seed = _seed_from(f"trend_{crop_lower}")
    rng = random.Random(seed)

    # Generate 3-day forecast with momentum
    momentum = rng.uniform(-0.08, 0.08)
    forecast = []
    current = base

    for day in range(3):
        daily_noise = rng.uniform(-0.03, 0.03)
        current = round(current * (1 + momentum + daily_noise), 2)
        forecast.append(current)

    # Determine trend from forecast slope
    if forecast[-1] > forecast[0] * 1.02:
        trend = "increasing"
    elif forecast[-1] < forecast[0] * 0.98:
        trend = "decreasing"
    else:
        trend = "stable"

    # Confidence based on momentum strength
    confidence = min(95, max(40, int(abs(momentum) * 800 + 50)))

    return {
        "crop": crop,
        "current_price": base,
        "forecast": forecast,
        "trend": trend,
        "trend_confidence": confidence,
        "momentum": round(momentum * 100, 2),  # percentage
    }


# ─── D. Selling Strategy Recommendation (Scoring-Based) ───

def _calculate_channel_score(
    price: float,
    max_price: float,
    reliability: float = 4.0,
    urgency_multiplier: float = 1.0,
    distance_km: float = 0,
    payment_days: int = 0,
) -> float:
    """
    Calculate a weighted score for a selling channel.
    Higher score = better option.

    score = price_weight + reliability_weight + urgency_weight
            - distance_penalty - payment_delay_penalty
    """
    # Normalize price (0-1 scale)
    price_score = (price / max_price) if max_price > 0 else 0

    # Normalize reliability (0-1 scale, already 1-5)
    reliability_score = reliability / 5.0

    # Urgency bonus
    urgency_score = urgency_multiplier

    # Distance penalty (0-1, closer is better)
    distance_score = max(0, 1 - (distance_km / 50))

    # Payment speed bonus (faster is better)
    payment_score = max(0, 1 - (payment_days / 14))

    total = (
        WEIGHTS["price"] * price_score
        + WEIGHTS["reliability"] * reliability_score
        + WEIGHTS["urgency"] * urgency_score
        + WEIGHTS["distance"] * distance_score
        + WEIGHTS["payment_speed"] * payment_score
    )

    return round(total, 4)


def recommend_selling_strategy(input_data: dict) -> dict:
    """
    Core decision engine. Uses scoring-based optimization to recommend
    the best selling strategy.

    Input:
        crop, quantity, location, storage_available

    Returns:
        best_channel, recommended_actions, expected_profit,
        price_comparison, reasoning, risk_alert, recommended_buyer
    """
    crop = input_data["crop"]
    quantity = input_data["quantity"]
    location = input_data["location"]
    storage_available = input_data.get("storage_available", False)

    # Gather intelligence
    prices = simulate_market_prices(crop, location)
    demand = simulate_buyer_demand(crop)
    trend = predict_price_trend(crop)

    mandi_price = prices["mandi_price"]
    pacs_price = prices["pacs_price"]
    buyers = prices["buyers"]

    # Build urgency lookup
    urgency_map = {d["buyer_id"]: d["urgency"] for d in demand}
    demand_qty_map = {d["buyer_id"]: d["demand_quantity"] for d in demand}

    # ─── Score every channel ───

    all_prices = [mandi_price, pacs_price] + [b["price_per_kg"] for b in buyers]
    max_price = max(all_prices) if all_prices else 1

    # Score mandi
    mandi_score = _calculate_channel_score(
        price=mandi_price,
        max_price=max_price,
        reliability=3.5,  # mandis are moderately reliable
        urgency_multiplier=0.5,
        distance_km=10,
        payment_days=1,
    )

    # Score PACS
    pacs_score = _calculate_channel_score(
        price=pacs_price,
        max_price=max_price,
        reliability=4.5,  # govt-backed, very reliable
        urgency_multiplier=0.3,
        distance_km=5,
        payment_days=7,
    )

    # Score each buyer
    buyer_scores = []
    for buyer in buyers:
        bid = buyer["id"]
        urgency = urgency_map.get(bid, "low")
        urg_mult = {"high": 1.0, "medium": 0.6, "low": 0.3}.get(urgency, 0.3)

        score = _calculate_channel_score(
            price=buyer["price_per_kg"],
            max_price=max_price,
            reliability=buyer["reliability_score"],
            urgency_multiplier=urg_mult,
            distance_km=buyer["distance_km"],
            payment_days=buyer["payment_days"],
        )
        buyer_scores.append({
            "buyer": buyer,
            "score": score,
            "urgency": urgency,
            "demand_qty": demand_qty_map.get(bid, 0),
        })

    # Sort buyers by score descending
    buyer_scores.sort(key=lambda x: x["score"], reverse=True)
    best_buyer = buyer_scores[0] if buyer_scores else None

    # ─── Determine Best Channel ───

    channel_scores = {
        "mandi": mandi_score,
        "pacs": pacs_score,
    }
    if best_buyer:
        channel_scores["buyer"] = best_buyer["score"]

    best_channel = max(channel_scores, key=channel_scores.get)

    # ─── Build Recommended Actions ───

    recommended_actions = []
    reasoning_parts = []
    risk_alert = None

    # Logic anchors for reasoning
    trend_direction = trend["trend"]
    trend_confidence = trend["trend_confidence"]

    if storage_available and trend_direction == "increasing" and trend_confidence > 55:
        # SPLIT STRATEGY — sell partial now, hold rest
        sell_now_pct = 0.6
        hold_pct = 0.4

        # Determine who to sell to now
        if best_channel == "buyer" and best_buyer:
            sell_target = best_buyer["buyer"]["name"]
            sell_price = best_buyer["buyer"]["price_per_kg"]
        elif best_channel == "mandi":
            sell_target = f"Mandi ({location})"
            sell_price = mandi_price
        else:
            sell_target = "PACS"
            sell_price = pacs_price

        sell_qty = int(quantity * sell_now_pct)
        hold_qty = quantity - sell_qty

        recommended_actions.append({
            "action": "sell_now",
            "quantity": sell_qty,
            "target": sell_target,
            "price": sell_price,
        })
        recommended_actions.append({
            "action": "hold",
            "quantity": hold_qty,
            "target": "Storage — sell in 2–3 days at higher price",
            "price": round(sell_price * 1.05, 2),  # projected
        })

        reasoning_parts.append(
            f"Prices are trending upward with {trend_confidence}% confidence"
        )
        reasoning_parts.append(
            "Since you have storage, we recommend selling 60% now and holding 40% for 2–3 days"
        )
        reasoning_parts.append(
            f"Expected price increase: ₹{trend['forecast'][-1]}/kg in 3 days"
        )

    else:
        # Check for high-urgency buyers
        high_urgency_buyers = [
            bs for bs in buyer_scores if bs["urgency"] == "high"
        ]

        if high_urgency_buyers and high_urgency_buyers[0]["buyer"]["price_per_kg"] >= mandi_price * 0.92:
            # Urgency-driven recommendation
            urgent = high_urgency_buyers[0]
            sell_qty = min(quantity, urgent["demand_qty"]) if urgent["demand_qty"] > 0 else quantity
            remaining = quantity - sell_qty

            recommended_actions.append({
                "action": "sell_now",
                "quantity": sell_qty,
                "target": urgent["buyer"]["name"],
                "price": urgent["buyer"]["price_per_kg"],
            })

            if remaining > 0:
                recommended_actions.append({
                    "action": "sell_now",
                    "quantity": remaining,
                    "target": f"Mandi ({location})",
                    "price": mandi_price,
                })

            reasoning_parts.append(
                f"High demand detected — {urgent['buyer']['name']} urgently needs {crop}"
            )
            reasoning_parts.append(
                f"Reliability score: {urgent['buyer']['reliability_score']}/5.0 with {urgent['buyer']['past_transactions']} past transactions"
            )
            reasoning_parts.append(
                f"Payment speed: {urgent['buyer']['payment_speed'].replace('_', ' ')}"
            )

        else:
            # Pure scoring-based recommendation
            if best_channel == "buyer" and best_buyer:
                recommended_actions.append({
                    "action": "sell_now",
                    "quantity": quantity,
                    "target": best_buyer["buyer"]["name"],
                    "price": best_buyer["buyer"]["price_per_kg"],
                })
                reasoning_parts.append(
                    f"{best_buyer['buyer']['name']} offers the best overall score "
                    f"(price: ₹{best_buyer['buyer']['price_per_kg']}/kg, "
                    f"reliability: {best_buyer['buyer']['reliability_score']}/5.0, "
                    f"distance: {best_buyer['buyer']['distance_km']}km)"
                )
            elif best_channel == "mandi":
                recommended_actions.append({
                    "action": "sell_now",
                    "quantity": quantity,
                    "target": f"Mandi ({location})",
                    "price": mandi_price,
                })
                reasoning_parts.append(
                    f"Mandi is offering the best price at ₹{mandi_price}/kg today"
                )
            else:
                recommended_actions.append({
                    "action": "sell_now",
                    "quantity": quantity,
                    "target": "PACS",
                    "price": pacs_price,
                })
                reasoning_parts.append(
                    f"PACS offers most reliable procurement at ₹{pacs_price}/kg with government backing"
                )

        # Add trend context
        if trend_direction == "decreasing":
            reasoning_parts.append(
                "Market trend is declining — selling now is advisable to avoid losses"
            )
            risk_alert = "⚠ Prices are expected to drop. Sell soon to minimize losses."
        elif trend_direction == "stable":
            reasoning_parts.append(
                "Market is stable — no urgency, but current price is fair"
            )
        elif not storage_available and trend_direction == "increasing":
            reasoning_parts.append(
                "Prices are trending up but you lack storage — selling now is safer"
            )
            risk_alert = "💡 Consider arranging storage to benefit from rising prices."

    # ─── Calculate Expected Profit ───

    total_revenue = sum(
        a["quantity"] * a["price"] for a in recommended_actions
    )
    expected_profit = round(total_revenue, 2)

    # ─── Price Comparison ───

    top_buyer_price = best_buyer["buyer"]["price_per_kg"] if best_buyer else 0
    price_comparison = {
        "mandi": {"price": mandi_price, "score": round(mandi_score * 100, 1)},
        "pacs": {"price": pacs_price, "score": round(pacs_score * 100, 1)},
        "best_buyer": {
            "name": best_buyer["buyer"]["name"] if best_buyer else "N/A",
            "price": top_buyer_price,
            "score": round(best_buyer["score"] * 100, 1) if best_buyer else 0,
            "reliability": best_buyer["buyer"]["reliability_score"] if best_buyer else 0,
            "payment_speed": best_buyer["buyer"]["payment_speed"] if best_buyer else "N/A",
        },
    }

    # ─── Recommended Buyer (Monetization Hook) ───

    recommended_buyer = None
    if best_buyer:
        recommended_buyer = {
            "id": best_buyer["buyer"]["id"],
            "name": best_buyer["buyer"]["name"],
            "specialty": best_buyer["buyer"]["specialty"],
            "price_per_kg": best_buyer["buyer"]["price_per_kg"],
            "reliability_score": best_buyer["buyer"]["reliability_score"],
            "payment_speed": best_buyer["buyer"]["payment_speed"],
            "past_transactions": best_buyer["buyer"]["past_transactions"],
            "distance_km": best_buyer["buyer"]["distance_km"],
        }

    # ─── Human-Readable Reasoning ───

    reasoning = ". ".join(reasoning_parts) + "."

    return {
        "best_channel": best_channel,
        "recommended_actions": recommended_actions,
        "expected_profit": expected_profit,
        "price_comparison": price_comparison,
        "reasoning": reasoning,
        "risk_alert": risk_alert,
        "recommended_buyer": recommended_buyer,
        "trend": {
            "direction": trend_direction,
            "confidence": trend_confidence,
            "forecast_3d": trend["forecast"],
        },
        "scoring_breakdown": {
            "mandi_score": round(mandi_score * 100, 1),
            "pacs_score": round(pacs_score * 100, 1),
            "top_buyer_score": round(best_buyer["score"] * 100, 1) if best_buyer else 0,
            "weights_used": WEIGHTS,
        },
    }

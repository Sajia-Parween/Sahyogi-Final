from typing import Dict


def calculate_risk_and_sell_confidence(
    advice_data: Dict,
    market_projection: Dict
) -> Dict:

    score = 50  # neutral baseline
    factors = {}

    # --------------------------
    # MARKET TREND (Granular)
    # --------------------------
    trend = advice_data.get("market_trend")
    trend_strength = market_projection.get("trend_strength", 0)

    if trend == "rising":
        # Scale based on how strong the uptrend actually is
        if trend_strength > 5:
            score += 25
            factors["market_trend"] = f"+25 (Strong uptrend, slope={trend_strength})"
        elif trend_strength > 2:
            score += 15
            factors["market_trend"] = f"+15 (Moderate uptrend, slope={trend_strength})"
        else:
            score += 5
            factors["market_trend"] = f"+5 (Weak uptrend, slope={trend_strength})"
    elif trend == "stable":
        score += 0
        factors["market_trend"] = "0 (Stable market)"
    elif trend == "falling":
        if trend_strength < -5:
            score -= 25
            factors["market_trend"] = f"-25 (Strong downtrend, slope={trend_strength})"
        elif trend_strength < -2:
            score -= 15
            factors["market_trend"] = f"-15 (Moderate downtrend, slope={trend_strength})"
        else:
            score -= 5
            factors["market_trend"] = f"-5 (Weak downtrend, slope={trend_strength})"
    else:
        factors["market_trend"] = "0 (Unknown trend)"

    # --------------------------
    # CROP STAGE (More granular)
    # --------------------------
    stage = advice_data.get("crop_stage")

    if stage == "Harvest":
        score += 20
        factors["crop_stage"] = "+20 (Harvest ready — ideal time to sell)"
    elif stage == "Maturity":
        score += 12
        factors["crop_stage"] = "+12 (Approaching harvest)"
    elif stage == "Grain Filling":
        score += 5
        factors["crop_stage"] = "+5 (Grain filling — almost ready)"
    elif stage == "Flowering":
        score -= 5
        factors["crop_stage"] = "-5 (Still flowering — wait recommended)"
    elif stage in ["Tillering", "Vegetative Growth", "Jointing"]:
        score -= 15
        factors["crop_stage"] = "-15 (Too early — crop still growing)"
    elif stage in ["Germination", "Sowing", "Land Preparation"]:
        score -= 25
        factors["crop_stage"] = "-25 (Way too early to sell)"
    else:
        score -= 5
        factors["crop_stage"] = "-5 (Unknown stage — caution)"

    # --------------------------
    # SOIL CONDITION
    # --------------------------
    soil_advice = advice_data.get("soil_advice", [])

    if isinstance(soil_advice, list) and len(soil_advice) > 3:
        score -= 12
        factors["soil_health"] = "-12 (Multiple soil issues detected)"
    elif isinstance(soil_advice, list) and len(soil_advice) > 0:
        score -= 5
        factors["soil_health"] = f"-5 ({len(soil_advice)} soil issue(s) detected)"
    else:
        score += 5
        factors["soil_health"] = "+5 (Healthy soil)"

    # --------------------------
    # PROJECTION INFLUENCE (Proportional)
    # --------------------------
    percent_7 = market_projection.get("percent_change_7_days", 0)
    percent_14 = market_projection.get("percent_change_14_days", 0)
    volatility = market_projection.get("volatility", 0)

    # Proportional adjustment based on actual projected change
    projection_7_adj = round(percent_7 * 2, 1)  # 1% change → ±2 points
    projection_14_adj = round(percent_14 * 1, 1)  # 1% change → ±1 point

    projection_total = round(projection_7_adj + projection_14_adj, 1)
    projection_total = max(-20, min(20, projection_total))  # Cap at ±20

    score += projection_total

    if projection_total > 0:
        factors["price_projection"] = f"+{projection_total} (Prices expected to rise)"
    elif projection_total < 0:
        factors["price_projection"] = f"{projection_total} (Prices expected to fall)"
    else:
        factors["price_projection"] = "0 (Flat price projection)"

    # --------------------------
    # VOLATILITY (Proportional penalty)
    # --------------------------
    if volatility > 50:
        vol_penalty = -min(15, round((volatility - 50) / 10, 1))
        score += vol_penalty
        factors["volatility"] = f"{vol_penalty} (High volatility = ₹{volatility} std dev)"
    elif volatility > 20:
        vol_penalty = -round((volatility - 20) / 15, 1)
        score += vol_penalty
        factors["volatility"] = f"{vol_penalty} (Moderate volatility)"
    else:
        factors["volatility"] = "0 (Low volatility — stable)"

    # --------------------------
    # PRICE vs MOVING AVERAGE
    # --------------------------
    current_price = market_projection.get("current_price", 0)
    ma_7 = market_projection.get("moving_average_7", current_price)

    if current_price > 0 and ma_7 > 0:
        price_vs_ma = ((current_price - ma_7) / ma_7) * 100

        if price_vs_ma > 2:
            adj = round(min(8, price_vs_ma * 2), 1)
            score += adj
            factors["price_vs_avg"] = f"+{adj} (Price above 7-day average)"
        elif price_vs_ma < -2:
            adj = round(max(-8, price_vs_ma * 2), 1)
            score += adj
            factors["price_vs_avg"] = f"{adj} (Price below 7-day average)"
        else:
            factors["price_vs_avg"] = "0 (Price near average)"

    # --------------------------
    # Clamp Score
    # --------------------------
    score = max(0, min(100, round(score, 1)))
    sell_confidence = score

    # --------------------------
    # Recommendation Logic
    # --------------------------
    if score >= 80:
        recommendation = "Strong Sell Opportunity"
    elif score >= 65:
        recommendation = "Moderate Sell Opportunity"
    elif score >= 50:
        recommendation = "Sell with Caution"
    elif score >= 35:
        recommendation = "Neutral — Monitor Market"
    elif score >= 20:
        recommendation = "High Risk — Wait Before Selling"
    else:
        recommendation = "Do Not Sell — Very Unfavorable"

    explanation = (
        f"Confidence score of {score}% calculated using: market trend "
        f"(slope={trend_strength}), crop stage ({stage}), soil health, "
        f"7-day projection ({percent_7}%), volatility (₹{volatility}), "
        f"and price-to-average comparison."
    )

    return {
        "risk_score": score,
        "sell_confidence": sell_confidence,
        "recommendation": recommendation,
        "risk_factors": factors,
        "explanation": explanation
    }

def volatility_alert(volatility: float) -> Dict:

    if volatility > 150:
        return {
            "alert": "High market volatility detected",
            "risk_level": "High"
        }

    elif 80 < volatility <= 150:
        return {
            "alert": "Moderate volatility, monitor closely",
            "risk_level": "Medium"
        }

    else:
        return {
            "alert": "Stable market conditions",
            "risk_level": "Low"
        }


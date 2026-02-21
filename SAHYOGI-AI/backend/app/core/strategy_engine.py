def generate_partial_sell_strategy(risk_score: float) -> dict:

    if risk_score >= 80:
        return {
            "sell_now_percent": 80,
            "hold_percent": 20,
            "reason": "Strong market confidence"
        }

    elif 60 <= risk_score < 80:
        return {
            "sell_now_percent": 50,
            "hold_percent": 50,
            "reason": "Moderate opportunity, balance risk"
        }

    elif 40 <= risk_score < 60:
        return {
            "sell_now_percent": 30,
            "hold_percent": 70,
            "reason": "Uncertain market, cautious selling"
        }

    else:
        return {
            "sell_now_percent": 10,
            "hold_percent": 90,
            "reason": "High risk, hold majority"
        }


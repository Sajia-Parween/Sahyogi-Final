"""
IVR Intelligence Module — Conversational AI for Voice Queries
Replaces menu-based IVR with intent-based conversational system.

Provides:
- Intent detection from natural language
- Entity extraction (crop, quantity, storage)
- Conversational flow with follow-up questions
- Human-friendly voice responses (layered: simple → detail)
"""

import re
from typing import Optional
from app.services.supply_engine import recommend_selling_strategy


# ─── Intent Detection ───

INTENT_KEYWORDS = {
    "SELL_RECOMMENDATION": [
        "sell", "selling", "where to sell", "best place", "should i sell",
        "when to sell", "recommend", "strategy", "advice", "suggestion",
        "what should i do", "help me sell", "sell my crop", "best option",
        "maximize", "profit", "optimal", "best way",
    ],
    "PRICE_CHECK": [
        "price", "rate", "cost", "how much", "current price", "market price",
        "mandi price", "pacs price", "kya bhav", "kitna", "daam", "rate kya",
        "today price", "what is the price",
    ],
    "BEST_BUYER": [
        "buyer", "best buyer", "who should i sell to", "who is buying",
        "find buyer", "connect buyer", "trader", "merchant", "who pays more",
        "top buyer", "reliable buyer",
    ],
}


def detect_intent(text: str) -> str:
    """
    Detect user intent from natural language text.
    Uses keyword matching — sufficient for rule-based system.

    Returns: SELL_RECOMMENDATION | PRICE_CHECK | BEST_BUYER | UNKNOWN
    """
    text_lower = text.lower().strip()

    # Score each intent by keyword matches
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[intent] = score

    if not scores:
        return "UNKNOWN"

    return max(scores, key=scores.get)


# ─── Entity Extraction ───

CROP_NAMES = [
    "tomato", "wheat", "rice", "maize", "cotton", "sugarcane",
    "onion", "potato", "mustard", "soybean", "groundnut", "chilli",
]

LOCATION_NAMES = [
    "sambalpur", "bargarh", "jharsuguda", "rairakhol", "attabira",
    "sonepur", "bolangir", "bhubaneswar", "cuttack", "rourkela",
]


def extract_entities(text: str) -> dict:
    """
    Extract crop, quantity, location, and storage from text.
    Uses keyword and pattern matching.
    """
    text_lower = text.lower().strip()
    entities = {}

    # Extract crop
    for crop in CROP_NAMES:
        if crop in text_lower:
            entities["crop"] = crop
            break

    # Extract quantity (number + kg/quintal/ton)
    qty_patterns = [
        r"(\d+)\s*(?:kg|kilo|kilos|kilogram)",
        r"(\d+)\s*(?:quintal|quintals|qtl)",
        r"(\d+)\s*(?:ton|tons|tonne|tonnes)",
        r"(\d+)\s*(?:bags?)",
        r"(\d+)\s*(?:units?)",
    ]
    for pattern in qty_patterns:
        match = re.search(pattern, text_lower)
        if match:
            qty = int(match.group(1))
            # Convert quintals to kg
            if "quintal" in text_lower or "qtl" in text_lower:
                qty *= 100
            elif "ton" in text_lower:
                qty *= 1000
            elif "bag" in text_lower:
                qty *= 50  # standard bag ≈ 50kg
            entities["quantity"] = qty
            break
    
    # Try bare numbers if no unit found
    if "quantity" not in entities:
        bare_num = re.search(r"\b(\d{2,})\b", text_lower)
        if bare_num:
            entities["quantity"] = int(bare_num.group(1))

    # Extract location
    for loc in LOCATION_NAMES:
        if loc in text_lower:
            entities["location"] = loc.capitalize()
            break

    # Extract storage
    storage_positive = ["storage", "store", "warehouse", "godown", "can store", "have storage", "yes storage"]
    storage_negative = ["no storage", "cant store", "cannot store", "don't have storage", "no godown"]

    for neg in storage_negative:
        if neg in text_lower:
            entities["storage_available"] = False
            break
    else:
        for pos in storage_positive:
            if pos in text_lower:
                entities["storage_available"] = True
                break

    return entities


# ─── Required Input Collection ───

REQUIRED_FIELDS = {
    "SELL_RECOMMENDATION": ["crop", "quantity"],
    "PRICE_CHECK": ["crop"],
    "BEST_BUYER": ["crop"],
}

FOLLOW_UP_QUESTIONS = {
    "crop": "Which crop would you like to sell? For example: tomato, wheat, rice, or onion.",
    "quantity": "How much quantity do you have? Please tell in kilograms.",
    "storage_available": "Do you have storage available to hold your crop for a few days?",
}


def collect_required_inputs(intent: str, existing_data: dict) -> list[str]:
    """
    Check which required fields are missing for the given intent.
    Returns list of missing field names.
    """
    required = REQUIRED_FIELDS.get(intent, ["crop"])
    missing = [field for field in required if field not in existing_data]
    return missing


# ─── Conversational IVR Handler ───

def handle_ivr_query(text_input: str, session_data: Optional[dict] = None) -> dict:
    """
    Main conversational IVR handler.

    Flow:
    1. Detect intent
    2. Extract entities from text
    3. Merge with session data (accumulated context)
    4. If missing data → return follow-up question
    5. Call supply engine for recommendation
    6. Convert to layered voice response (simple + detail)

    Returns:
        {
            "intent": str,
            "response_text": str,           # Simple voice answer
            "detail_text": str | None,      # Optional detailed breakdown
            "needs_more_info": bool,
            "missing_fields": list,
            "extracted_entities": dict,
            "recommendation": dict | None,
        }
    """
    session = session_data or {}

    # Step 1: Detect intent (use session intent if already set)
    intent = session.get("intent") or detect_intent(text_input)

    # Step 2: Extract entities from current input
    new_entities = extract_entities(text_input)

    # Step 3: Merge with session data
    merged = {**session}
    merged.update(new_entities)
    merged["intent"] = intent

    # Step 4: Check for missing required inputs
    missing = collect_required_inputs(intent, merged)

    if missing:
        # Ask the first missing field
        follow_up = FOLLOW_UP_QUESTIONS.get(missing[0], f"Please provide: {missing[0]}")
        return {
            "intent": intent,
            "response_text": follow_up,
            "detail_text": None,
            "needs_more_info": True,
            "missing_fields": missing,
            "extracted_entities": merged,
            "recommendation": None,
        }

    # Step 5: All data collected — run the intelligence engine

    if intent == "SELL_RECOMMENDATION":
        input_data = {
            "crop": merged["crop"],
            "quantity": merged.get("quantity", 100),
            "location": merged.get("location", "Sambalpur"),
            "storage_available": merged.get("storage_available", False),
        }
        recommendation = recommend_selling_strategy(input_data)
        response = _build_sell_response(recommendation, input_data)

        return {
            "intent": intent,
            "response_text": response["simple"],
            "detail_text": response["detail"],
            "needs_more_info": False,
            "missing_fields": [],
            "extracted_entities": merged,
            "recommendation": recommendation,
        }

    elif intent == "PRICE_CHECK":
        from app.services.supply_engine import simulate_market_prices
        prices = simulate_market_prices(
            merged["crop"],
            merged.get("location", "Sambalpur"),
        )
        response = _build_price_response(prices)

        return {
            "intent": intent,
            "response_text": response["simple"],
            "detail_text": response["detail"],
            "needs_more_info": False,
            "missing_fields": [],
            "extracted_entities": merged,
            "recommendation": prices,
        }

    elif intent == "BEST_BUYER":
        from app.services.supply_engine import simulate_market_prices
        prices = simulate_market_prices(
            merged["crop"],
            merged.get("location", "Sambalpur"),
        )
        response = _build_buyer_response(prices)

        return {
            "intent": intent,
            "response_text": response["simple"],
            "detail_text": response["detail"],
            "needs_more_info": False,
            "missing_fields": [],
            "extracted_entities": merged,
            "recommendation": prices,
        }

    else:
        return {
            "intent": "UNKNOWN",
            "response_text": (
                "I can help you decide where and when to sell your crop. "
                "Try asking something like: 'Where should I sell my tomato?' "
                "or 'What is the price of wheat today?'"
            ),
            "detail_text": None,
            "needs_more_info": False,
            "missing_fields": [],
            "extracted_entities": merged,
            "recommendation": None,
        }


# ─── Layered Response Builders ───


def _build_sell_response(rec: dict, input_data: dict) -> dict:
    """
    Build layered voice response for selling recommendation.
    Simple first, detail on request.
    """
    actions = rec["recommended_actions"]
    crop = input_data["crop"]
    best = rec["best_channel"]

    # ─── Simple Answer ───
    if len(actions) == 1 and actions[0]["action"] == "sell_now":
        simple = (
            f"You should sell your {crop} now to {actions[0]['target']} "
            f"at ₹{actions[0]['price']} per kg. "
            f"Your expected total is ₹{rec['expected_profit']}."
        )
    elif len(actions) == 2:
        simple = (
            f"I recommend a split strategy for your {crop}. "
            f"Sell {actions[0]['quantity']}kg now to {actions[0]['target']} "
            f"at ₹{actions[0]['price']} per kg, "
            f"and hold {actions[1]['quantity']}kg for better prices in 2–3 days."
        )
    else:
        simple = f"Based on current market analysis, the best option for your {crop} is through {best}."

    # Add risk alert to simple
    if rec.get("risk_alert"):
        simple += f" {rec['risk_alert']}"

    # ─── Detailed Breakdown ───
    detail_parts = [f"Here's the detailed analysis for your {crop}:"]

    # Price comparison
    pc = rec["price_comparison"]
    detail_parts.append(
        f"Mandi price: ₹{pc['mandi']['price']}/kg (score: {pc['mandi']['score']}%), "
        f"PACS price: ₹{pc['pacs']['price']}/kg (score: {pc['pacs']['score']}%), "
        f"Best buyer: {pc['best_buyer']['name']} at ₹{pc['best_buyer']['price']}/kg "
        f"(score: {pc['best_buyer']['score']}%, reliability: {pc['best_buyer']['reliability']}/5)"
    )

    # Trend
    trend = rec.get("trend", {})
    if trend.get("direction"):
        detail_parts.append(
            f"Market trend: {trend['direction']} with {trend['confidence']}% confidence"
        )

    # Reasoning
    detail_parts.append(f"Reasoning: {rec['reasoning']}")

    detail = ". ".join(detail_parts)

    return {"simple": simple, "detail": detail}


def _build_price_response(prices: dict) -> dict:
    """Build layered response for price check."""
    crop = prices["crop"]
    simple = (
        f"Current prices for {crop}: "
        f"Mandi is ₹{prices['mandi_price']}/kg, "
        f"PACS is ₹{prices['pacs_price']}/kg. "
    )

    if prices["buyers"]:
        top = prices["buyers"][0]
        simple += f"Best buyer offer is ₹{top['price_per_kg']}/kg from {top['name']}."

    detail_parts = [f"All buyer offers for {crop}:"]
    for b in prices["buyers"][:5]:
        detail_parts.append(
            f"{b['name']}: ₹{b['price_per_kg']}/kg, "
            f"{b['distance_km']}km away, "
            f"reliability {b['reliability_score']}/5, "
            f"payment: {b['payment_speed'].replace('_', ' ')}"
        )

    return {"simple": simple, "detail": ". ".join(detail_parts)}


def _build_buyer_response(prices: dict) -> dict:
    """Build layered response for best buyer query."""
    crop = prices["crop"]
    buyers = prices["buyers"]

    if not buyers:
        return {
            "simple": f"No buyers found for {crop} at the moment.",
            "detail": None,
        }

    best = buyers[0]
    simple = (
        f"The best buyer for your {crop} is {best['name']}, "
        f"offering ₹{best['price_per_kg']}/kg. "
        f"They have a reliability score of {best['reliability_score']}/5 "
        f"and are {best['distance_km']}km away. "
        f"Payment speed: {best['payment_speed'].replace('_', ' ')}. "
        f"Would you like to connect with them?"
    )

    detail_parts = ["Top 3 buyers ranked by score:"]
    for i, b in enumerate(buyers[:3], 1):
        detail_parts.append(
            f"{i}. {b['name']}: ₹{b['price_per_kg']}/kg, "
            f"reliability {b['reliability_score']}/5, "
            f"{b['past_transactions']} past transactions, "
            f"{b['distance_km']}km away"
        )

    return {"simple": simple, "detail": ". ".join(detail_parts)}


# ─── Explanation Trigger ───

def explain_reasoning(recommendation: dict) -> str:
    """
    When user asks 'why', return the detailed reasoning.
    """
    if not recommendation:
        return "No recommendation available to explain."

    parts = []

    # Scoring breakdown
    scoring = recommendation.get("scoring_breakdown", {})
    if scoring:
        parts.append(
            f"Our scoring system evaluated all options: "
            f"Mandi scored {scoring.get('mandi_score', 0)}%, "
            f"PACS scored {scoring.get('pacs_score', 0)}%, "
            f"and the top buyer scored {scoring.get('top_buyer_score', 0)}%"
        )
        weights = scoring.get("weights_used", {})
        if weights:
            parts.append(
                f"We weighted price at {int(weights.get('price', 0) * 100)}%, "
                f"reliability at {int(weights.get('reliability', 0) * 100)}%, "
                f"urgency at {int(weights.get('urgency', 0) * 100)}%, "
                f"distance at {int(weights.get('distance', 0) * 100)}%, "
                f"and payment speed at {int(weights.get('payment_speed', 0) * 100)}%"
            )

    # Main reasoning
    if recommendation.get("reasoning"):
        parts.append(recommendation["reasoning"])

    # Risk context
    if recommendation.get("risk_alert"):
        parts.append(f"Risk note: {recommendation['risk_alert']}")

    return ". ".join(parts) + "."

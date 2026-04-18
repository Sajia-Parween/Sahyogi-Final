from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path

from app.services.supabase_service import (
    get_farmer_by_phone,
    get_soil_by_farmer_id
)
from app.core.advice_engine import generate_full_advice
from app.core.market_projection import generate_market_projection
from app.ai.gemini_chat import chat_with_context
from app.ai.tts import generate_audio
from app.models.api_response import success_response, error_response

# Feature data fetchers
from app.services.buyer_engine import (
    get_farmer_requests, list_active_buyers,
)


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[4]
MARKET_FILE = BASE_DIR / "data" / "market_prices" / "wheat_prices.csv"


class ChatRequest(BaseModel):
    phone: str
    question: str


# ─── Smart Feature Detection & Direct Answers ───

def _detect_and_answer_feature(phone: str, question: str, farmer_name: str) -> str | None:
    """
    Detect if the question is about a platform feature and answer
    directly from DB data — NO Gemini needed.
    Returns None if it's NOT a feature query (needs Gemini).
    """
    q = question.lower()

    # ─── Connection Requests ───
    request_kw = [
        "request", "connection", "who sent", "who contacted", "pending",
        "accepted", "rejected", "connect", "deal", "offer", "buyer request",
        "buying request", "mera request", "kaun", "bheja", "koi aaya",
    ]
    if any(kw in q for kw in request_kw):
        try:
            requests = get_farmer_requests(phone)
            if not requests:
                return f"Namaste {farmer_name}! You currently have no connection requests. When buyers want to purchase your crops, their requests will appear here on your dashboard."

            incoming = [r for r in requests if r.get("direction") == "buyer_to_farmer"]
            outgoing = [r for r in requests if r.get("direction") == "farmer_to_buyer"]
            pending = [r for r in requests if r.get("status") == "pending"]
            accepted = [r for r in requests if r.get("status") == "accepted"]
            rejected = [r for r in requests if r.get("status") == "rejected"]

            lines = [f"Namaste {farmer_name}! Here is your connection requests summary:\n"]
            lines.append(f"Total Requests: {len(requests)}")
            lines.append(f"- Pending: {len(pending)}")
            lines.append(f"- Accepted: {len(accepted)}")
            lines.append(f"- Rejected: {len(rejected)}\n")

            if incoming:
                lines.append("--- BUYER REQUESTS TO YOU ---")
                for r in incoming:
                    status_icon = "Pending" if r["status"] == "pending" else ("Accepted" if r["status"] == "accepted" else "Rejected")
                    lines.append(
                        f"  Buyer: {r.get('buyer_name', 'Unknown')} | "
                        f"Crop: {r.get('crop', '?')} | "
                        f"Quantity: {r.get('quantity', '?')}kg | "
                        f"Status: {status_icon} | "
                        f"Date: {r.get('created_at', '?')[:10]}"
                    )
                    if r.get("message"):
                        msg = r["message"][:150]
                        lines.append(f"    Message: {msg}")
                lines.append("")

            if outgoing:
                lines.append("--- YOUR SENT REQUESTS ---")
                for r in outgoing:
                    status_icon = "Pending" if r["status"] == "pending" else ("Accepted" if r["status"] == "accepted" else "Rejected")
                    lines.append(
                        f"  To Buyer: {r.get('buyer_name', 'Unknown')} | "
                        f"Crop: {r.get('crop', '?')} | "
                        f"Quantity: {r.get('quantity', '?')}kg | "
                        f"Status: {status_icon}"
                    )
                    if r.get("buyer_response_message"):
                        lines.append(f"    Buyer's response: {r['buyer_response_message']}")

            if pending:
                lines.append(f"\nYou have {len(pending)} pending request(s). Check your dashboard to Accept or Decline.")

            return "\n".join(lines)
        except Exception as e:
            return f"Sorry, I couldn't fetch your requests right now. Error: {str(e)[:100]}"

    # ─── Available Buyers ───
    buyer_kw = [
        "buyer", "sell", "who can buy", "available buyer", "best buyer",
        "where to sell", "kharidaar", "bechna",
    ]
    if any(kw in q for kw in buyer_kw):
        try:
            buyers = list_active_buyers()
            if not buyers:
                return f"{farmer_name}, there are currently no active buyers on the platform. Check back soon!"

            lines = [f"{farmer_name}, here are {len(buyers)} active buyers on Sahyogi:\n"]
            for i, b in enumerate(buyers, 1):
                crops = ", ".join(b.get("crops_buying", [])[:4])
                pr = b.get("price_range", {})
                lines.append(
                    f"{i}. {b.get('business_name', b.get('name', '?'))} "
                    f"({b.get('business_type', '?').replace('_', ' ')}) - {b.get('location', '?')}\n"
                    f"   Crops: {crops}\n"
                    f"   Price: Rs {pr.get('min', '?')}-{pr.get('max', '?')}/kg | "
                    f"Payment: {b.get('payment_speed', '?').replace('_', ' ')} | "
                    f"Rating: {b.get('reliability_score', '?')}/5 | "
                    f"Deals: {b.get('total_transactions', 0)}"
                )
            lines.append("\nYou can connect with any buyer from the Supply Intelligence section on your dashboard.")
            return "\n".join(lines)
        except Exception as e:
            return f"Sorry, couldn't fetch buyers: {str(e)[:100]}"

    # ─── Weather ───
    weather_kw = ["weather", "rain", "temperature", "forecast", "humidity", "mausam", "barish", "taapman"]
    if any(kw in q for kw in weather_kw):
        try:
            import httpx
            resp = httpx.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": 21.4669, "longitude": 83.9812,
                    "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "timezone": "Asia/Kolkata", "forecast_days": 3,
                },
                timeout=5,
            )
            w = resp.json()
            cur = w.get("current", {})
            daily = w.get("daily", {})
            wmo = {0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
                   45: "Foggy", 51: "Light drizzle", 61: "Light rain", 63: "Moderate rain",
                   65: "Heavy rain", 80: "Rain showers", 95: "Thunderstorm"}

            lines = [f"{farmer_name}, here is the live weather for Sambalpur, Odisha:\n"]
            lines.append(f"Current Temperature: {cur.get('temperature_2m', '?')} C")
            lines.append(f"Condition: {wmo.get(cur.get('weather_code', 0), 'Unknown')}")
            lines.append(f"Humidity: {cur.get('relative_humidity_2m', '?')}%")
            lines.append(f"Wind Speed: {cur.get('wind_speed_10m', '?')} km/h")
            lines.append(f"Current Rainfall: {cur.get('precipitation', 0)} mm\n")

            dates = daily.get("time", [])
            highs = daily.get("temperature_2m_max", [])
            lows = daily.get("temperature_2m_min", [])
            rains = daily.get("precipitation_sum", [])
            lines.append("3-Day Forecast:")
            for i in range(min(3, len(dates))):
                lines.append(f"  {dates[i]}: High {highs[i]}C / Low {lows[i]}C | Rain: {rains[i]}mm")

            if cur.get("precipitation", 0) > 0:
                lines.append("\nRain Alert! Consider covering your crop or delaying spray activities.")
            if cur.get("temperature_2m", 0) > 40:
                lines.append("\nHeat Alert! Irrigate your crop and avoid field work during afternoon.")

            return "\n".join(lines)
        except Exception:
            return "Weather data temporarily unavailable. Please check the weather card on your dashboard."

    # ─── PACS ───
    pacs_kw = ["pacs", "booking", "slot", "queue", "cooperative"]
    if any(kw in q for kw in pacs_kw):
        try:
            from app.services.supabase_service import supabase
            bookings = supabase.table("pacs_bookings").select("*").eq("farmer_phone", phone).execute()
            if bookings.data:
                lines = [f"{farmer_name}, your PACS bookings:\n"]
                for b in bookings.data:
                    lines.append(f"  Service: {b.get('service', '?')} | Status: {b.get('status', '?')} | Time: {b.get('preferred_time', '?')}")
                return "\n".join(lines)
            else:
                return f"{farmer_name}, you have no PACS bookings. You can book a slot from the PACS section on your dashboard."
        except Exception:
            return "PACS data temporarily unavailable."

    # ─── Community ───
    community_kw = ["community", "discuss", "post", "farmer nearby", "pest alert", "tip", "other farmer"]
    if any(kw in q for kw in community_kw):
        try:
            import httpx
            res = httpx.get("http://localhost:8001/api/v1/community/posts", timeout=5)
            posts = res.json().get("data", [])
            if posts:
                lines = [f"{farmer_name}, here are the latest community posts:\n"]
                for p in posts[:5]:
                    cat_labels = {"pest": "Pest Alert", "price": "Price Update", "rain": "Rain Update", "tips": "Tips"}
                    lines.append(
                        f"  [{cat_labels.get(p['category'], p['category'])}] {p['farmer_name']} ({p.get('location', '?')}):\n"
                        f"    {p['message'][:120]}\n"
                        f"    Likes: {p.get('likes', 0)}"
                    )
                lines.append("\nVisit the Community section on your dashboard to post or discuss.")
                return "\n".join(lines)
            return f"{farmer_name}, no community posts yet. Be the first to share a pest alert, price update, or farming tip!"
        except Exception:
            return "Community data temporarily unavailable."

    # ─── Loan / Insurance ───
    loan_kw = ["loan", "insurance", "kcc", "kisan credit", "emi", "pmfby", "mudra", "bima", "fasal"]
    if any(kw in q for kw in loan_kw):
        return (
            f"{farmer_name}, here are the government loan & insurance schemes available:\n\n"
            "1. Kisan Credit Card (KCC)\n"
            "   - Crop loans at 4% interest (subsidized)\n"
            "   - Max Rs 3,00,000 | Repay in 12 months\n"
            "   - Apply at any bank with land records + Aadhaar\n"
            "   - Helpline: 1800-180-1551\n\n"
            "2. PM Fasal Bima Yojana (PMFBY)\n"
            "   - Crop insurance: 2% premium for Kharif, 1.5% for Rabi\n"
            "   - Covers flood, drought, hailstorm, pest damage\n"
            "   - Claim within 72 hours of crop loss\n"
            "   - Helpline: 1800-200-7710\n\n"
            "3. PM MUDRA Yojana\n"
            "   - Farm equipment loans up to Rs 10,00,000\n"
            "   - No collateral needed | 7-9% interest\n"
            "   - Helpline: 1800-180-1111\n\n"
            "4. PM-KISAN\n"
            "   - Rs 6,000/year direct to your bank (3 installments)\n"
            "   - Check status: pmkisan.gov.in\n"
            "   - Helpline: 011-24300606\n\n"
            "Visit the Loan & Insurance section on your dashboard for details and EMI tracker."
        )

    # ─── Alerts ───
    alert_kw = ["alert", "notification", "warning", "reminder"]
    if any(kw in q for kw in alert_kw):
        return (
            f"{farmer_name}, Smart Alerts are active on your dashboard. They monitor:\n\n"
            "- Rain Forecast: Alerts when rain is expected in the next 5 days\n"
            "- Price Changes: Notifies when market prices rise or drop significantly\n"
            "- Disease Outbreaks: Seasonal disease risk warnings\n"
            "- Fertilizer Reminders: Stage-based reminders for your crop\n\n"
            "Check the Smart Alerts card at the top of your dashboard for current alerts."
        )

    # Not a feature query — needs Gemini
    return None


def _gather_platform_data(phone: str, question: str) -> str:
    """Gather platform data for Gemini context enrichment."""
    q = question.lower()
    sections = []

    request_kw = ["request", "connection", "buyer", "who sent", "who contacted", "pending", "deal", "offer"]
    if any(kw in q for kw in request_kw):
        try:
            requests = get_farmer_requests(phone)
            if requests:
                lines = [f"Connection Requests: {len(requests)} total"]
                for r in requests[:5]:
                    direction = "FROM buyer" if r.get("direction") == "buyer_to_farmer" else "TO buyer"
                    lines.append(f"  [{r['status']}] {direction} {r.get('buyer_name', '?')} | {r.get('crop', '?')} {r.get('quantity', '?')}kg | {r.get('created_at', '?')[:10]}")
                sections.append("\n".join(lines))
            else:
                sections.append("Connection Requests: None found.")
        except Exception:
            pass

    buyer_kw = ["buyer", "sell", "who can buy", "where to sell"]
    if any(kw in q for kw in buyer_kw):
        try:
            buyers = list_active_buyers()
            if buyers:
                lines = [f"Active Buyers: {len(buyers)}"]
                for b in buyers[:5]:
                    lines.append(f"  {b.get('business_name', '?')} in {b.get('location', '?')} | Buys: {', '.join(b.get('crops_buying', [])[:3])}")
                sections.append("\n".join(lines))
        except Exception:
            pass

    if not sections:
        return ""
    return "\n--- PLATFORM DATA ---\n" + "\n".join(sections) + "\n--- END ---\n"


@router.post("/")
def chat_with_farmer(request: ChatRequest):

    # 1. Fetch farmer
    farmer = get_farmer_by_phone(request.phone)
    if not farmer:
        return error_response(message="Farmer not found", error="not_found", status_code=404)

    farmer_name = farmer.get("name", "Farmer")

    # 2. Try direct feature answer FIRST (no Gemini needed, no TTS — instant response)
    direct_answer = _detect_and_answer_feature(request.phone, request.question, farmer_name)
    if direct_answer:
        return success_response(
            message="Chat response generated successfully",
            data={
                "farmer": farmer_name,
                "question": request.question,
                "text_response": direct_answer,
                "audio_file": None
            }
        )

    # 3. For non-feature queries, use Gemini with full context + timeout
    import concurrent.futures

    def _run_gemini_chat():
        soil = get_soil_by_farmer_id(farmer["id"])
        soil_data = {
            "nitrogen": soil.get("nitrogen") if soil else None,
            "phosphorus": soil.get("phosphorus") if soil else None,
            "potassium": soil.get("potassium") if soil else None,
            "ph": soil.get("ph") if soil else None,
        }

        sowing_date = datetime.strptime(farmer["sowing_date"], "%Y-%m-%d").date()

        structured_advice = generate_full_advice(
            crop=farmer["crop"],
            sowing_date=sowing_date,
            soil_data=soil_data,
            market_file_path=str(MARKET_FILE)
        )

        market_data = None
        try:
            market_data = generate_market_projection(str(MARKET_FILE))
        except Exception:
            pass

        farmer_info = {
            "name": farmer.get("name", "N/A"),
            "crop": farmer.get("crop", "N/A"),
            "district": farmer.get("district", "N/A"),
            "sowing_date": farmer.get("sowing_date", "N/A"),
        }

        platform_data = _gather_platform_data(request.phone, request.question)
        language = farmer.get("language", "en")

        return chat_with_context(
            structured_advice=structured_advice,
            question=request.question,
            language=language,
            market_data=market_data,
            farmer_info=farmer_info,
            platform_data=platform_data,
        )

    try:
        # Run Gemini with 15s max timeout
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(_run_gemini_chat)
            response_text = future.result(timeout=15)

        # Skip TTS to keep response fast
        return success_response(
            message="Chat response generated successfully",
            data={
                "farmer": farmer_name,
                "question": request.question,
                "text_response": response_text,
                "audio_file": None
            }
        )

    except concurrent.futures.TimeoutError:
        fallback = (
            f"Namaste {farmer_name}! The AI is taking too long to respond. "
            f"Please try again in a moment.\n\n"
            f"Quick tip: You can ask me about:\n"
            f"- 'Who sent me a request?' - See your connection requests\n"
            f"- 'Show available buyers' - Browse active buyers\n"
            f"- 'What is the weather?' - Live weather data\n"
            f"These work instantly!"
        )
        return success_response(
            message="Chat response (timeout fallback)",
            data={
                "farmer": farmer_name,
                "question": request.question,
                "text_response": fallback,
                "audio_file": None
            }
        )

    except Exception as e:
        err_msg = str(e)

        if "429" in err_msg or "quota" in err_msg.lower() or "exhausted" in err_msg.lower():
            fallback = (
                f"Namaste {farmer_name}! The AI service is currently busy due to high usage. "
                f"Please try again in a minute.\n\n"
                f"In the meantime, try asking:\n"
                f"- 'Who sent me a request?' - See your connection requests\n"
                f"- 'Show available buyers' - Browse active buyers\n"
                f"- 'What is the weather?' - Get live weather\n"
                f"These features work instantly without AI!"
            )
        else:
            fallback = (
                f"Sorry {farmer_name}, I had trouble processing your question. "
                f"Please try again or use the dashboard features directly."
            )

        return success_response(
            message="Chat response (fallback)",
            data={
                "farmer": farmer_name,
                "question": request.question,
                "text_response": fallback,
                "audio_file": None
            }
        )

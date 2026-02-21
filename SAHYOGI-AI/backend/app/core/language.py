from typing import Dict


# -----------------------------
# Stage Translations
# -----------------------------
STAGE_TRANSLATIONS = {
    "en": {
        "Sowing": "Sowing",
        "Germination": "Germination",
        "Tillering": "Tillering",
        "Flowering": "Flowering",
        "Maturity": "Maturity",
        "Harvest": "Harvest"
    },
    "hi": {
        "Sowing": "बुवाई",
        "Germination": "अंकुरण",
        "Tillering": "टिलरिंग",
        "Flowering": "फूल आना",
        "Maturity": "परिपक्वता",
        "Harvest": "कटाई"
    },
    "or": {
        "Sowing": "ବୁଆଁ",
        "Germination": "ଅଙ୍କୁରୋଦ୍ଗମ",
        "Tillering": "ଟିଲରିଂ",
        "Flowering": "ଫୁଲ ଆସିବା",
        "Maturity": "ପକ୍ୱତା",
        "Harvest": "କଟାଇ"
    }
}


# -----------------------------
# Market Trend Translations
# -----------------------------
MARKET_TRANSLATIONS = {
    "en": {
        "rising": "Prices are rising. You may consider waiting before selling.",
        "falling": "Prices are falling. Consider selling soon.",
        "stable": "Prices are stable. Decide based on your needs."
    },
    "hi": {
        "rising": "बाजार मूल्य बढ़ रहे हैं। अभी बेचने के बजाय इंतजार करना लाभदायक हो सकता है।",
        "falling": "बाजार मूल्य घट रहे हैं। जल्द बेचने पर विचार करें।",
        "stable": "बाजार मूल्य स्थिर हैं। अपनी आवश्यकता के अनुसार निर्णय लें।"
    },
    "or": {
        "rising": "ବଜାର ଦର ବଢୁଛି। ବିକ୍ରି ପୂର୍ବରୁ କିଛି ସମୟ ଅପେକ୍ଷା କରିବା ଭଲ।",
        "falling": "ବଜାର ଦର କମୁଛି। ଶୀଘ୍ର ବିକ୍ରି କରିବା ବିଚାର କରନ୍ତୁ।",
        "stable": "ବଜାର ଦର ସ୍ଥିର ଅଛି। ଆପଣଙ୍କ ଆବଶ୍ୟକତା ଅନୁସାରେ ସିଦ୍ଧାନ୍ତ ନିଅନ୍ତୁ।"
    }
}


def translate_stage(stage: str, language: str) -> str:
    return STAGE_TRANSLATIONS.get(language, {}).get(stage, stage)


def translate_market(trend: str, language: str) -> str:
    return MARKET_TRANSLATIONS.get(language, {}).get(trend, trend)


def format_advice_response(advice_data: Dict, language: str = "en") -> str:

    crop_stage = advice_data["crop_stage"]
    days = advice_data["days_since_sowing"]
    soil_advice = " ".join(advice_data["soil_advice"])
    market_trend = advice_data["market_trend"]

    translated_stage = translate_stage(crop_stage, language)
    translated_market = translate_market(market_trend, language)

    # ---------------- ENGLISH ----------------
    if language == "en":
        return (
            f"You are currently in the {translated_stage} stage "
            f"({days} days since sowing). "
            f"Soil recommendation: {soil_advice} "
            f"Market update: {translated_market}"
        )

    # ---------------- HINDI ----------------
    elif language == "hi":
        return (
            f"आप वर्तमान में {translated_stage} अवस्था में हैं "
            f"(बुवाई के {days} दिन बाद)। "
            f"मिट्टी सलाह: {soil_advice} "
            f"बाज़ार स्थिति: {translated_market}"
        )

    # ---------------- ODIA ----------------
    elif language == "or":
        return (
            f"ଆପଣ ବର୍ତ୍ତମାନ {translated_stage} ଅବସ୍ଥାରେ ଅଛନ୍ତି "
            f"(ବୁଆଁର {days} ଦିନ ପରେ)। "
            f"ମାଟି ପରାମର୍ଶ: {soil_advice} "
            f"ବଜାର ସୂଚନା: {translated_market}"
        )

    else:
        return "Unsupported language."

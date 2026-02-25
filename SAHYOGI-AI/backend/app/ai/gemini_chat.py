import os
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

# ─── Comprehensive Agricultural Knowledge Base ───
AGRI_KNOWLEDGE = """
## MSP (Minimum Support Price) — Rabi 2024-25 Season
| Crop          | MSP (₹/quintal) |
|---------------|------------------|
| Wheat         | 2,275            |
| Barley        | 1,850            |
| Gram (Chana)  | 5,440            |
| Masur (Lentil)| 6,425            |
| Rapeseed/Mustard | 5,650         |
| Safflower     | 5,800            |

## MSP — Kharif 2024-25 Season
| Crop          | MSP (₹/quintal) |
|---------------|------------------|
| Paddy (Common)| 2,300            |
| Paddy (Grade A)| 2,320           |
| Jowar (Hybrid)| 3,371            |
| Jowar (Maldandi)| 3,421          |
| Bajra         | 2,500            |
| Ragi          | 3,846            |
| Maize         | 2,225            |
| Tur (Arhar)   | 7,000            |
| Moong         | 8,558            |
| Urad          | 6,950            |
| Cotton (Medium)| 6,620           |
| Cotton (Long) | 7,020            |
| Groundnut     | 6,377            |
| Sunflower     | 6,760            |
| Soybean (Yellow)| 4,892          |
| Sesamum       | 8,635            |
| Niger Seed    | 7,734            |

## Government Schemes for Farmers
1. **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**
   - ₹6,000/year in 3 installments of ₹2,000 each
   - Direct transfer to bank account
   - For all land-holding farmer families
   - Apply at: pmkisan.gov.in

2. **PM Fasal Bima Yojana (PMFBY)** — Crop Insurance
   - Premium: 2% for Kharif, 1.5% for Rabi, 5% for commercial/horticultural crops
   - Covers natural calamities, pests, diseases
   - Enroll before sowing deadline through banks/CSCs
   - Claims within 72 hours of crop loss

3. **Kisan Credit Card (KCC)**
   - Short-term crop loans at 4% interest (with subsidy)
   - Credit limit based on landholding and crop
   - Can be used for crop production, post-harvest, and allied activities
   - Apply at any bank branch

4. **eNAM (National Agriculture Market)**
   - Online trading platform for agricultural commodities
   - Compare prices across mandis nationwide
   - Transparent bidding process
   - Reduces middlemen

5. **Soil Health Card Scheme**
   - Free soil testing every 2 years
   - Recommendations for nutrient management
   - Available at local Krishi Vigyan Kendra (KVK)

6. **PM Kisan MAN-DHAN Yojana** — Pension Scheme
   - ₹3,000/month pension after age 60
   - Monthly contribution: ₹55-200 (based on entry age)
   - For small and marginal farmers (land up to 2 hectares)

7. **Paramparagat Krishi Vikas Yojana (PKVY)** — Organic Farming
   - ₹50,000/hectare for 3 years for organic farming
   - Cluster-based approach

## Fertilizer Guidelines by Crop Stage
### Wheat
- **Sowing**: Apply full dose of Phosphorus (DAP) and Potassium (MOP) as basal dose. Use 60 kg DAP + 40 kg MOP per acre.
- **Germination (8-21 days)**: No additional fertilizer needed. Ensure adequate moisture.
- **Tillering (22-45 days)**: First top-dressing of Nitrogen — apply 30-35 kg Urea per acre.
- **Flowering (46-75 days)**: Second top-dressing of Nitrogen — apply 25-30 kg Urea per acre. Foliar spray of micronutrients (Zinc, Iron) if deficiency seen.
- **Maturity (76-110 days)**: No fertilizer application. Avoid excess nitrogen.
- **Harvest (111+ days)**: No fertilizer needed.

### General NPK Guidelines
- Nitrogen (N): Promotes leaf and stem growth. Apply in splits.
- Phosphorus (P): Promotes root development and flowering. Apply at sowing.
- Potassium (K): Strengthens plants against disease. Apply at sowing.

## Irrigation Best Practices
### Wheat
- **Crown Root Initiation (21-25 days)**: Most critical irrigation. Missing this reduces yield by 20-25%.
- **Tillering (40-45 days)**: Important for tiller development.
- **Late Jointing (60-65 days)**: Essential for stem elongation.
- **Flowering (80-85 days)**: Critical for grain formation.
- **Milking (100-105 days)**: Important for grain filling.
- **Dough Stage (110-115 days)**: Last irrigation. Stop watering 15-20 days before harvest.
- **Total irrigations needed**: 4-6 depending on soil type and rainfall.

## Storage & Post-Harvest Tips
1. **Moisture content**: Dry grain to 12-14% moisture before storage.
2. **Storage structures**: Use pucca godowns, metal bins, or hermetic bags.
3. **Pest control**: Use aluminum phosphide tablets (1 tablet per quintal) for fumigation.
4. **Government storage**: FCI godowns, CWC warehouses available at subsidized rates.
5. **Warehouse receipt**: Get warehouse receipt for pledged loan against stored produce.
6. **Sell timing**: Check mandi prices daily. Sell when price is above MSP and moving average.

## Common Crop Diseases (Wheat)
| Disease        | Symptoms                          | Treatment                           |
|----------------|-----------------------------------|-------------------------------------|
| Yellow Rust     | Yellow stripes on leaves          | Spray Propiconazole 25EC (1ml/L)   |
| Brown Rust      | Brown oval pustules on leaves     | Spray Mancozeb 75WP (2.5g/L)      |
| Karnal Bunt     | Black powder in grains            | Treat seeds with Carboxin (2g/kg)  |
| Powdery Mildew  | White powdery growth on leaves    | Spray Sulphur WP 80 (3g/L)        |
| Loose Smut      | Black spores replace grain head   | Treat seeds with Carbendazim       |

## Pest Management (Wheat)
| Pest            | Damage                            | Control                             |
|-----------------|-----------------------------------|-------------------------------------|
| Aphid           | Sucks sap, yellowing leaves       | Spray Imidacloprid (0.5ml/L)       |
| Termite         | Root damage, wilting              | Apply Chlorpyrifos in soil         |
| Pink Stem Borer | Hollow stems, dead hearts         | Spray Quinalphos (2ml/L)           |
| Army Worm       | Defoliates crop rapidly           | Spray Cypermethrin (1ml/L)         |

## Weather Advisory Guidelines
- **Frost alert**: Cover young crops with straw mulch during December-January frost.
- **Heat wave**: Irrigate immediately if temperature exceeds 35°C during grain filling.
- **Hailstorm damage**: File PMFBY claim within 72 hours. Document damage with photos.
- **Excess rain**: Ensure proper drainage. Apply fungicide within 48 hours.
"""


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "or": "Odia (ଓଡ଼ିଆ)",
}


def chat_with_context(
    structured_advice: dict,
    question: str,
    language: str = "en",
    market_data: dict | None = None,
    farmer_info: dict | None = None,
):

    # Resolve full language name for clear Gemini instructions
    lang_name = LANGUAGE_NAMES.get(language, "English")

    # Build farmer context section
    farmer_context = ""
    if farmer_info:
        farmer_context = f"""
Farmer Profile:
- Name: {farmer_info.get('name', 'N/A')}
- Crop: {farmer_info.get('crop', 'N/A')}
- District: {farmer_info.get('district', 'N/A')}
- Sowing Date: {farmer_info.get('sowing_date', 'N/A')}
"""

    # Build market data section
    market_context = ""
    if market_data:
        market_context = f"""
Live Market Data:
- Current Market Price: ₹{market_data.get('current_price', 'N/A')}/quintal
- 7-Day Moving Average: ₹{market_data.get('moving_average_7', 'N/A')}/quintal
- 7-Day Price Projection: ₹{market_data.get('projection_7_days', 'N/A')}/quintal
- 14-Day Price Projection: ₹{market_data.get('projection_14_days', 'N/A')}/quintal
- Market Trend: {market_data.get('trend_direction', 'N/A')}
- Price Volatility: ₹{market_data.get('volatility', 'N/A')} std dev
"""

    context_prompt = f"""You are SAHYOGI, an expert AI agricultural assistant for Indian farmers.
You have deep knowledge of Indian agriculture, government schemes, MSP rates, fertilizers,
irrigation, pest management, crop diseases, weather advisories, and market analysis.

{AGRI_KNOWLEDGE}

--- FARMER-SPECIFIC DATA ---
{farmer_context}
Crop Advisory Data:
- Crop Stage: {structured_advice.get("crop_stage")}
- Days Since Sowing: {structured_advice.get("days_since_sowing")}
- Soil Advice: {structured_advice.get("soil_advice")}
- Market Trend: {structured_advice.get("market_trend")}
- Market Advice: {structured_advice.get("market_advice")}
{market_context}
--- END OF DATA ---

INSTRUCTIONS:
1. Use the farmer-specific data above to personalize your response.
2. Use the agricultural knowledge base to answer general questions about MSP, schemes, fertilizers, diseases, pests, irrigation, storage, etc.
3. When discussing prices, always reference the actual market data provided above.
4. You MUST respond entirely in {lang_name}. Use the native script of that language. Use practical, action-oriented language.
5. If the farmer asks about MSP, provide the exact MSP rate from the knowledge base.
6. If asked about government schemes, explain eligibility, benefits, and how to apply.
7. Keep responses concise but informative. Use bullet points where helpful.
8. Do NOT use any markdown formatting like *, **, #, or backticks. Use plain text only.

Farmer's Question: {question}
"""

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=context_prompt
    )

    # Strip any markdown formatting characters
    clean_text = response.text.replace("*", "").replace("#", "")
    return clean_text

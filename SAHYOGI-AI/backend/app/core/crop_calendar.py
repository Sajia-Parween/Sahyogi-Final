from datetime import date, timedelta
from typing import Optional


# Crop stage definitions: (stage_name, start_day_offset, duration_days, activities, tips)
CROP_STAGES = {
    "wheat": [
        ("Land Preparation", 0, 7, 
         ["Plough the field 2-3 times", "Level the field", "Apply farmyard manure (10-12 tonnes/hectare)"],
         "Best done 15-20 days before sowing for optimal soil preparation."),
        ("Sowing", 7, 7, 
         ["Seed treatment with fungicide", "Sow seeds at 5-6 cm depth", "Maintain row spacing of 20-22.5 cm"],
         "Use certified seed variety suited to your region. Seed rate: 100-125 kg/hectare."),
        ("Germination", 14, 10, 
         ["Ensure adequate soil moisture", "Monitor for gaps in germination", "Light irrigation if needed"],
         "Seeds typically germinate in 7-10 days. Keep soil moist but not waterlogged."),
        ("Tillering", 24, 21, 
         ["First irrigation (Crown Root Initiation)", "Apply first dose of nitrogen fertilizer", "Weed management"],
         "Critical stage for yield. Apply 1/3 of total nitrogen dose at this stage."),
        ("Jointing", 45, 15, 
         ["Second irrigation", "Apply second dose of nitrogen", "Monitor for rust and other diseases"],
         "Stems begin elongating. This stage determines the number of grains per ear."),
        ("Booting & Heading", 60, 15, 
         ["Third irrigation (critical)", "Foliar spray of micronutrients if deficient", "Scout for aphids and ear cockle"],
         "Most critical irrigation stage. Water stress here causes maximum yield loss."),
        ("Flowering", 75, 10, 
         ["Fourth irrigation", "Avoid pesticide spraying during flowering", "Monitor for Karnal bunt"],
         "Pollination occurs during this stage. Avoid disturbing the crop."),
        ("Grain Filling", 85, 20, 
         ["Fifth irrigation", "Monitor for ear head diseases", "Prevent bird damage"],
         "Grains are forming and filling. Good irrigation ensures plump grains."),
        ("Maturity & Ripening", 105, 15, 
         ["Stop irrigation", "Check grain moisture content", "Prepare harvesting equipment"],
         "Crop is ready when grain moisture drops to 14-16%. Leaves turn golden yellow."),
        ("Harvesting", 120, 10, 
         ["Harvest at 12-14% moisture", "Dry grains in sun for 2-3 days", "Store in clean, dry containers"],
         "Timely harvesting prevents shattering losses. Delay causes 1-2% daily loss."),
    ],
    "rice": [
        ("Nursery Preparation", 0, 7,
         ["Prepare raised nursery beds", "Treat seeds with fungicide", "Sow pre-germinated seeds"],
         "Nursery area should be 1/20th of the main field area."),
        ("Nursery Growth", 7, 14,
         ["Maintain thin layer of water", "Apply nursery fertilizer", "Protect from birds and rats"],
         "Green manuring in main field can be done during this period."),
        ("Land Preparation & Puddling", 21, 7,
         ["Flood the field", "Plough in standing water", "Level the field with planker"],
         "Good puddling reduces water percolation and controls weeds."),
        ("Transplanting", 28, 7,
         ["Transplant 20-25 day old seedlings", "Maintain 20x15 cm spacing", "Plant 2-3 seedlings per hill"],
         "Transplant in the evening for better establishment. Shallow planting is preferred."),
        ("Vegetative Growth", 35, 30,
         ["Maintain 5 cm water level", "Apply nitrogen in splits", "Weed management at 20 and 40 days"],
         "Active tillering phase. Number of tillers determines potential yield."),
        ("Panicle Initiation", 65, 10,
         ["Critical irrigation stage", "Apply final dose of nitrogen", "Monitor for stem borer"],
         "Panicle is forming inside the stem. Water stress now reduces grain number."),
        ("Flowering", 75, 10,
         ["Maintain water level", "Avoid pesticide spray", "Monitor for blast disease"],
         "Flowering happens in early morning. Temperature above 35°C causes sterility."),
        ("Grain Filling", 85, 20,
         ["Continue irrigation", "Apply potassium if deficient", "Monitor for brown plant hopper"],
         "Grains transition from milky to dough stage. Keep field moist."),
        ("Maturity", 105, 10,
         ["Drain the field", "Check grain hardness", "Arrange combine harvester"],
         "Harvest when 85% of grains are straw-colored and hard."),
        ("Harvesting & Drying", 115, 10,
         ["Harvest at 20-22% moisture", "Dry to 14% moisture for storage", "Clean and grade the grains"],
         "Sun-dry for 2-3 days. Avoid drying on bare road to prevent contamination."),
    ],
    "cotton": [
        ("Land Preparation", 0, 10,
         ["Deep ploughing", "Apply FYM at 10 tonnes/hectare", "Form ridges and furrows"],
         "Cotton prefers well-drained, deep black soil. Avoid waterlogged areas."),
        ("Sowing", 10, 7,
         ["Sow Bt cotton seeds at 90x60 cm spacing", "Seed treatment with imidacloprid", "Apply basal fertilizer"],
         "Best sowing time: June-July with onset of monsoon."),
        ("Germination & Establishment", 17, 14,
         ["Gap filling within 10 days", "Light irrigation if dry spell", "Thinning to one plant per hill"],
         "Ensure 90%+ germination for optimal plant population."),
        ("Vegetative Growth", 31, 30,
         ["Inter-cultivation for weed control", "First top dressing of nitrogen", "Monitor for jassids and aphids"],
         "Square formation begins. Good vegetative growth is key for boll production."),
        ("Squaring & Flowering", 61, 30,
         ["Second top dressing", "IPM for bollworm management", "Adequate irrigation"],
         "Flowers appear. Each flower takes 50 days to become a mature boll."),
        ("Boll Development", 91, 30,
         ["Continue pest monitoring", "Irrigation every 15-20 days", "Apply micronutrients"],
         "Green bolls are forming. Protect from pink bollworm with pheromone traps."),
        ("Boll Opening & Picking", 121, 30,
         ["First picking when 50% bolls open", "Pick in dry weather only", "Grade cotton by quality"],
         "4-5 pickings at 15-day intervals. Morning picking gives better quality."),
        ("Final Harvest", 151, 15,
         ["Complete remaining pickings", "Uproot and destroy crop residue", "Prepare field for next crop"],
         "Destroy old plants to break pest cycle. Do not leave cotton stalks standing."),
    ],
    "sugarcane": [
        ("Land Preparation", 0, 10,
         ["Deep ploughing and harrowing", "Apply FYM at 25 tonnes/hectare", "Form furrows at 90 cm spacing"],
         "Sugarcane needs deep, well-prepared soil for good root development."),
        ("Planting", 10, 7,
         ["Select 3-budded setts from healthy crop", "Treat setts with fungicide", "Place setts in furrows and cover"],
         "Spring planting: February-March. Autumn planting: October-November."),
        ("Germination", 17, 21,
         ["Light irrigation every 7 days", "Gap filling at 30 days", "Control early weeds"],
         "Germination takes 15-20 days. Maintain optimum moisture."),
        ("Tillering", 38, 30,
         ["Apply nitrogen and potassium", "Irrigation every 10-12 days", "Earthing up partial"],
         "Maximum tillers form during this stage. Good tillers = good yield."),
        ("Grand Growth", 68, 90,
         ["Heavy irrigation every 7-10 days", "Apply second dose of nitrogen", "Full earthing up"],
         "70% of cane weight gained during this period. Never allow water stress."),
        ("Maturity & Ripening", 158, 60,
         ["Reduce irrigation gradually", "Withhold nitrogen", "Check brix readings for sugar content"],
         "Sugar accumulates as water is reduced. Brix should be above 18."),
        ("Harvesting", 218, 15,
         ["Harvest close to ground level", "Remove tops and trash", "Transport to mill within 24 hours"],
         "Delay in crushing after harvest reduces sugar recovery by 0.6% per day."),
    ],
}

# Default fallback for unknown crops
DEFAULT_STAGES = [
    ("Land Preparation", 0, 10,
     ["Clear and plough the field", "Apply organic manure", "Level the soil"],
     "Good land preparation ensures better germination and crop establishment."),
    ("Sowing / Planting", 10, 7,
     ["Sow seeds at recommended depth", "Maintain proper spacing", "Apply basal fertilizer"],
     "Follow recommended seed rate and spacing for your crop variety."),
    ("Vegetative Growth", 17, 30,
     ["Regular irrigation", "Weed management", "Apply nitrogen fertilizer"],
     "Monitor crop regularly for any pest or disease symptoms."),
    ("Flowering", 47, 15,
     ["Ensure adequate moisture", "Apply micronutrients if needed", "Pest monitoring"],
     "Flowering is a critical stage. Avoid water stress."),
    ("Fruit/Grain Development", 62, 25,
     ["Continue irrigation", "Monitor for diseases", "Bird protection if needed"],
     "Ensure good nutrition for quality produce."),
    ("Maturity", 87, 15,
     ["Reduce irrigation", "Check maturity indicators", "Prepare for harvest"],
     "Harvest at the right maturity for best quality and shelf life."),
    ("Harvesting", 102, 10,
     ["Harvest at optimal moisture", "Handle produce carefully", "Dry and store properly"],
     "Timely harvesting minimizes post-harvest losses."),
]


def generate_crop_calendar(crop: str, sowing_date: date) -> list[dict]:
    """
    Generate a crop calendar with stages, activities, and tips.
    Returns a list of stage dictionaries with current stage highlighted.
    """

    crop_key = crop.lower().strip()
    stages_data = CROP_STAGES.get(crop_key, DEFAULT_STAGES)

    today = date.today()
    days_since_sowing = (today - sowing_date).days
    calendar = []

    for stage_name, start_offset, duration, activities, tips in stages_data:
        start = sowing_date + timedelta(days=start_offset)
        end = start + timedelta(days=duration)

        # Determine if this is the current stage
        is_current = start <= today <= end
        is_completed = today > end
        is_upcoming = today < start

        if is_current:
            status = "current"
        elif is_completed:
            status = "completed"
        else:
            status = "upcoming"

        # Calculate progress within stage
        if is_current:
            days_into_stage = (today - start).days
            progress = min(100, int((days_into_stage / duration) * 100))
        elif is_completed:
            progress = 100
        else:
            progress = 0

        calendar.append({
            "stage_name": stage_name,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "duration_days": duration,
            "activities": activities,
            "tips": tips,
            "status": status,
            "progress": progress,
            "is_current": is_current,
        })

    return calendar

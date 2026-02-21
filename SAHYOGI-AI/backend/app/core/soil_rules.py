from typing import Dict, List


def generate_soil_advisory(soil_data: Dict, current_stage: str) -> List[str]:
    """
    Generate fertilizer and soil improvement advice
    based on Soil Health Card data and crop stage.
    """

    if not soil_data:
        return ["Soil data not available. Please update Soil Health Card values."]

    advice = []

    nitrogen = soil_data.get("nitrogen")
    phosphorus = soil_data.get("phosphorus")
    potassium = soil_data.get("potassium")
    ph = soil_data.get("ph")

    # Nitrogen advisory
    if nitrogen == "low" and current_stage in ["Tillering", "Germination"]:
        advice.append("Apply Nitrogen fertilizer (e.g., Urea) in recommended quantity.")

    # Phosphorus advisory
    if phosphorus == "low" and current_stage == "Sowing":
        advice.append("Apply Phosphorus fertilizer (e.g., DAP) during early crop stage.")

    # Potassium advisory
    if potassium == "low":
        advice.append("Consider adding Potassium fertilizer to improve crop strength.")

    # pH advisory
    if ph:
        if ph < 6:
            advice.append("Soil is acidic. Consider lime application to balance pH.")
        elif ph > 8:
            advice.append("Soil is alkaline. Consider gypsum treatment if necessary.")

    if not advice:
        advice.append("Soil nutrient levels are adequate. Continue standard practices.")

    return advice

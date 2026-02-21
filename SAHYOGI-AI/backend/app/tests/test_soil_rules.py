from app.core.soil_rules import generate_soil_advisory


def test_soil_low_nitrogen():
    soil_data = {
        "nitrogen": "low",
        "phosphorus": "medium",
        "potassium": "medium",
        "ph": 6.5
    }

    result = generate_soil_advisory(soil_data, "Tillering")

    assert any("Nitrogen" in advice for advice in result)

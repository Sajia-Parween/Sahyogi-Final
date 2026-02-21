from datetime import date, timedelta
from app.core.advice_engine import generate_full_advice


def test_full_advice():
    sowing_date = date.today() - timedelta(days=25)

    soil_data = {
        "nitrogen": "low",
        "phosphorus": "medium",
        "potassium": "medium",
        "ph": 6.5
    }

    market_path = "../data/market_prices/wheat_prices.csv"

    result = generate_full_advice(
        crop="wheat",
        sowing_date=sowing_date,
        soil_data=soil_data,
        market_file_path=market_path
    )

    assert "crop_stage" in result
    assert "soil_advice" in result
    assert "market_advice" in result

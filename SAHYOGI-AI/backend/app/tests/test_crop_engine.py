from datetime import date, timedelta
from app.core.crop_engine import get_crop_stage


def test_crop_stage():
    sowing_date = date.today() - timedelta(days=25)
    result = get_crop_stage("wheat", sowing_date)

    assert result["stage"] == "Tillering"

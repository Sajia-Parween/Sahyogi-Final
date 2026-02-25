"""
Mandi price comparison engine with historical averages,
per-mandi trends, and MSP comparison.
"""
import pandas as pd
from typing import Dict
from app.services.cache import cached, DEFAULT_CSV_TTL


# Real MSP values (₹/quintal) for 2025-26
MSP_VALUES = {
    "wheat": 2275,
    "rice": 2320,
    "maize": 2090,
    "cotton": 7121,
    "sugarcane": 340,
}


@cached(ttl=DEFAULT_CSV_TTL, key_prefix="mandi_csv")
def load_mandi_data(csv_path: str) -> pd.DataFrame:
    """Load and cache mandi data."""
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    return df


def get_latest_prices(df: pd.DataFrame) -> pd.DataFrame:
    """Get prices from the most recent date."""
    latest_date = df["date"].max()
    return df[df["date"] == latest_date]


def per_mandi_trend(df: pd.DataFrame, mandi_name: str) -> str:
    """Determine 7-day price trend for a specific mandi."""
    mandi_df = df[df["mandi"] == mandi_name].sort_values("date")
    if len(mandi_df) < 7:
        return "insufficient_data"

    recent_7 = mandi_df["price"].iloc[-7:].mean()
    prior_7 = mandi_df["price"].iloc[-14:-7].mean() if len(mandi_df) >= 14 else mandi_df["price"].mean()

    diff_pct = ((recent_7 - prior_7) / prior_7) * 100
    if diff_pct > 1:
        return "rising"
    elif diff_pct < -1:
        return "falling"
    return "stable"


def fair_price_indicator(current_price: float, historical_avg: float, msp: float) -> Dict:
    """Compare current price against historical average and MSP."""
    percent_vs_avg = ((current_price - historical_avg) / historical_avg) * 100
    percent_vs_msp = ((current_price - msp) / msp) * 100

    return {
        "vs_30_day_average_percent": round(percent_vs_avg, 2),
        "vs_msp_percent": round(percent_vs_msp, 2),
        "is_above_msp": current_price >= msp,
    }


def mandi_price_comparison(csv_path: str, farmer_district: str, crop: str = "wheat") -> Dict:
    """
    Comprehensive mandi comparison with trends and MSP reference.
    """
    df = load_mandi_data(csv_path)
    latest = get_latest_prices(df)

    local_mandi = latest[latest["district"] == farmer_district]

    district_avg = latest["price"].mean()
    best_price = latest["price"].max()
    worst_price = latest["price"].min()
    best_mandi = latest.loc[latest["price"].idxmax()]["mandi"]
    worst_mandi = latest.loc[latest["price"].idxmin()]["mandi"]

    # 30-day historical average
    hist_avg = float(df["price"].mean()) if len(df) > 0 else district_avg

    # MSP comparison
    msp = MSP_VALUES.get(crop.lower(), 2275)
    local_price = float(local_mandi["price"].iloc[0]) if not local_mandi.empty else None

    # Per-mandi trends
    mandi_trends = {}
    for mandi_name in latest["mandi"].unique():
        mandi_trends[mandi_name] = per_mandi_trend(df, mandi_name)

    # Fair price indicator for local mandi
    fair_price = None
    if local_price is not None:
        fair_price = fair_price_indicator(local_price, hist_avg, msp)

    return {
        "local_price": local_price,
        "district_average": round(float(district_avg), 2),
        "historical_average": round(hist_avg, 2),
        "best_mandi_price": float(best_price),
        "best_mandi_name": best_mandi,
        "worst_mandi_price": float(worst_price),
        "worst_mandi_name": worst_mandi,
        "msp": msp,
        "is_above_msp": local_price >= msp if local_price else None,
        "mandi_trends": mandi_trends,
        "fair_price": fair_price,
    }

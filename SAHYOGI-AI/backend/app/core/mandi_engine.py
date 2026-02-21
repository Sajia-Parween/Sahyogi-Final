import pandas as pd
from typing import Dict, List

def load_mandi_data(csv_path: str) -> pd.DataFrame:
    print("Reading file from:", csv_path)

    df = pd.read_csv(csv_path)

    print("Columns found:", df.columns.tolist())  # 👈 ADD THIS

    df["date"] = pd.to_datetime(df["date"])
    df["price"] = pd.to_numeric(df["price"], errors="coerce")

    return df



def get_latest_prices(df: pd.DataFrame) -> pd.DataFrame:
    latest_date = df["date"].max()
    return df[df["date"] == latest_date]

def fair_price_indicator(current_price: float, historical_avg: float, msp: float) -> Dict:

    percent_vs_avg = ((current_price - historical_avg) / historical_avg) * 100
    percent_vs_msp = ((current_price - msp) / msp) * 100

    return {
        "vs_30_day_average_percent": round(percent_vs_avg, 2),
        "vs_msp_percent": round(percent_vs_msp, 2),
        "is_above_msp": current_price >= msp
    }



def mandi_price_comparison(csv_path: str, farmer_district: str) -> Dict:

    df = load_mandi_data(csv_path)
    latest = get_latest_prices(df)

    local_mandi = latest[latest["district"] == farmer_district]

    district_avg = latest["price"].mean()
    best_price = latest["price"].max()
    worst_price = latest["price"].min()

    best_mandi = latest.loc[latest["price"].idxmax()]["mandi"]

    return {
        "local_price": float(local_mandi["price"].iloc[0]) if not local_mandi.empty else None,
        "district_average": round(float(district_avg), 2),
        "best_mandi_price": float(best_price),
        "best_mandi_name": best_mandi,
        "worst_mandi_price": float(worst_price)
    }

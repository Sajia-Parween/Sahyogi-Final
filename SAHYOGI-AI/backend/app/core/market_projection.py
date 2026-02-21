import pandas as pd
import numpy as np
from typing import Dict


def load_market_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df = df.sort_values("date")
    df["price"] = df["price"].astype(float)
    return df


def calculate_moving_average(df: pd.DataFrame, window: int = 7) -> float:
    return df["price"].rolling(window=window).mean().iloc[-1]


def calculate_trend_strength(df: pd.DataFrame) -> float:
    prices = df["price"].values
    x = np.arange(len(prices))
    slope, _ = np.polyfit(x, prices, 1)
    return slope


def project_future_prices(df: pd.DataFrame, days_ahead: int = 7) -> float:
    prices = df["price"].values
    x = np.arange(len(prices))
    slope, intercept = np.polyfit(x, prices, 1)

    future_x = len(prices) + days_ahead
    projected_price = slope * future_x + intercept
    return round(float(projected_price), 2)


def generate_market_projection(csv_path: str) -> Dict:

    df = load_market_data(csv_path)

    current_price = float(df["price"].iloc[-1])
    ma_7 = calculate_moving_average(df, 7)
    slope = calculate_trend_strength(df)

    projected_7 = project_future_prices(df, 7)
    projected_14 = project_future_prices(df, 14)

    percent_change_7 = ((projected_7 - current_price) / current_price) * 100
    percent_change_14 = ((projected_14 - current_price) / current_price) * 100

    trend_direction = "rising" if slope > 0 else "falling"

    volatility = float(df["price"].std())

    return {
        "current_price": current_price,
        "moving_average_7": round(float(ma_7), 2),
        "trend_direction": trend_direction,
        "trend_strength": round(float(slope), 4),
        "volatility": round(volatility, 2),
        "projection_7_days": projected_7,
        "projection_14_days": projected_14,
        "percent_change_7_days": round(percent_change_7, 2),
        "percent_change_14_days": round(percent_change_14, 2),
    }

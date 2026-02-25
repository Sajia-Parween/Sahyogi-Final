"""
Market price projection engine using EWM, recent-window regression,
and confidence intervals for accurate, fast forecasting.
"""
import pandas as pd
import numpy as np
from typing import Dict
from app.services.cache import cached, DEFAULT_CSV_TTL


@cached(ttl=DEFAULT_CSV_TTL, key_prefix="csv")
def load_market_data(csv_path: str) -> pd.DataFrame:
    """Load and cache market data from CSV."""
    df = pd.read_csv(csv_path)
    df = df.sort_values("date").reset_index(drop=True)
    df["price"] = df["price"].astype(float)
    return df


def calculate_moving_average(df: pd.DataFrame, window: int = 7) -> float:
    """Simple moving average of last N days."""
    return float(df["price"].iloc[-window:].mean())


def calculate_ema(df: pd.DataFrame, span: int = 14) -> float:
    """Exponentially Weighted Moving Average — recent-biased."""
    return float(df["price"].ewm(span=span, adjust=False).mean().iloc[-1])


def calculate_trend_strength(df: pd.DataFrame, window: int = 30) -> float:
    """
    Linear regression slope on recent window only.
    Faster and more responsive than all-time regression.
    """
    recent = df["price"].values[-min(window, len(df)):]
    x = np.arange(len(recent))
    slope, _ = np.polyfit(x, recent, 1)
    return float(slope)


def project_future_prices(df: pd.DataFrame, days_ahead: int = 7) -> Dict:
    """
    Project future price using EWM-adjusted recent regression.
    Returns mean projection + confidence interval.
    """
    prices = df["price"].values
    n = min(30, len(prices))
    recent = prices[-n:]
    x = np.arange(n)

    # Degree-2 polynomial fits seasonal curvature better
    coeffs = np.polyfit(x, recent, min(2, n - 1))
    poly = np.poly1d(coeffs)

    future_x = n + days_ahead
    projected = float(poly(future_x))

    # EWM-adjusted: blend regression with EWM trend
    ewm_price = float(pd.Series(recent).ewm(span=14, adjust=False).mean().iloc[-1])
    ewm_trend = ewm_price - float(pd.Series(recent).ewm(span=14, adjust=False).mean().iloc[-2])
    ewm_projected = ewm_price + ewm_trend * days_ahead

    # Weighted blend: 60% regression, 40% EWM
    blended = 0.6 * projected + 0.4 * ewm_projected

    # Confidence interval from rolling std
    rolling_std = float(pd.Series(recent).rolling(window=min(7, n)).std().iloc[-1])
    confidence_low = blended - 1.96 * rolling_std * np.sqrt(days_ahead / 7)
    confidence_high = blended + 1.96 * rolling_std * np.sqrt(days_ahead / 7)

    return {
        "price": round(blended, 2),
        "confidence_low": round(float(confidence_low), 2),
        "confidence_high": round(float(confidence_high), 2),
    }


@cached(ttl=120, key_prefix="projection")
def generate_market_projection(csv_path: str) -> Dict:
    """
    Full market projection with EWM, moving averages, and confidence intervals.
    Cached for 2 minutes.
    """
    df = load_market_data(csv_path)

    current_price = float(df["price"].iloc[-1])
    prev_price = float(df["price"].iloc[-2]) if len(df) > 1 else current_price

    # Moving averages
    ma_7 = calculate_moving_average(df, 7)
    ma_14 = calculate_moving_average(df, 14)
    ma_30 = calculate_moving_average(df, 30)
    ema_14 = calculate_ema(df, 14)

    # Trend
    slope = calculate_trend_strength(df, 30)

    # Projections with confidence
    proj_7 = project_future_prices(df, 7)
    proj_14 = project_future_prices(df, 14)

    # Percent changes
    percent_change_7 = ((proj_7["price"] - current_price) / current_price) * 100
    percent_change_14 = ((proj_14["price"] - current_price) / current_price) * 100
    daily_change = ((current_price - prev_price) / prev_price) * 100

    trend_direction = "rising" if slope > 0.5 else ("falling" if slope < -0.5 else "stable")

    # Volatility: rolling 14-day std is more responsive
    volatility = float(df["price"].iloc[-14:].std()) if len(df) >= 14 else float(df["price"].std())

    return {
        "current_price": current_price,
        "previous_price": prev_price,
        "daily_change_percent": round(daily_change, 2),
        "moving_average_7": round(ma_7, 2),
        "moving_average_14": round(ma_14, 2),
        "moving_average_30": round(ma_30, 2),
        "ema_14": round(ema_14, 2),
        "trend_direction": trend_direction,
        "trend_strength": round(slope, 4),
        "volatility": round(volatility, 2),
        "projection_7_days": proj_7["price"],
        "projection_7_confidence_low": proj_7["confidence_low"],
        "projection_7_confidence_high": proj_7["confidence_high"],
        "projection_14_days": proj_14["price"],
        "projection_14_confidence_low": proj_14["confidence_low"],
        "projection_14_confidence_high": proj_14["confidence_high"],
        "percent_change_7_days": round(percent_change_7, 2),
        "percent_change_14_days": round(percent_change_14, 2),
    }

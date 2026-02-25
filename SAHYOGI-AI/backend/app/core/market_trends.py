"""
Market trend analysis using EMA crossover signals (MACD-style)
and momentum indicators for accurate trend detection.
"""
import pandas as pd
from typing import Dict, List


def load_market_prices(file_path: str) -> list:
    """
    Load historical market prices from CSV file.
    Expected format:
    date,price
    2026-01-01,2100
    """
    df = pd.read_csv(file_path)
    return df["price"].astype(float).tolist()


def compute_ema_series(prices: list, span: int) -> pd.Series:
    """Compute EMA series efficiently using pandas."""
    return pd.Series(prices).ewm(span=span, adjust=False).mean()


def analyze_market_trend(prices: list) -> Dict:
    """
    EMA crossover analysis with momentum for accurate trend detection.

    Uses:
    - Fast EMA (span=12) vs Slow EMA (span=26), similar to MACD
    - Rate of Change (ROC) momentum indicator
    - Trend strength as percentage
    """
    if len(prices) < 14:
        return {
            "trend": "insufficient_data",
            "advice": "Not enough market data to determine trend.",
            "trend_strength": 0,
            "momentum": 0,
        }

    series = pd.Series(prices)

    # EMA crossover (MACD-style)
    fast_ema = series.ewm(span=min(12, len(prices) - 1), adjust=False).mean()
    slow_ema = series.ewm(span=min(26, len(prices) - 1), adjust=False).mean()

    # Signal: difference between fast and slow EMA
    signal = float(fast_ema.iloc[-1] - slow_ema.iloc[-1])
    prev_signal = float(fast_ema.iloc[-2] - slow_ema.iloc[-2])

    # Trend strength as % of current price
    current_price = prices[-1]
    trend_strength = (signal / current_price) * 100 if current_price > 0 else 0

    # Momentum: Rate of Change over 7-day and 14-day
    roc_7 = ((prices[-1] - prices[-min(7, len(prices))]) / prices[-min(7, len(prices))]) * 100
    roc_14 = ((prices[-1] - prices[-min(14, len(prices))]) / prices[-min(14, len(prices))]) * 100

    # Short-term and long-term averages for additional context
    short_avg = series.iloc[-7:].mean()
    long_avg = series.iloc[-min(30, len(prices)):].mean()

    # Determine trend with strength classification
    if signal > 0 and trend_strength > 0.3:
        if trend_strength > 1.0:
            trend = "rising"
            advice = "Strong upward momentum. Prices are rising significantly — you may want to wait for peak before selling."
        else:
            trend = "rising"
            advice = "Market prices are trending upward. Consider timing your sale carefully."
    elif signal < 0 and trend_strength < -0.3:
        if trend_strength < -1.0:
            trend = "falling"
            advice = "Strong downward pressure. Selling sooner may protect against further losses."
        else:
            trend = "falling"
            advice = "Market prices are declining. Selling soon may reduce risk."
    else:
        trend = "stable"
        advice = "Market prices are stable. Selling now is reasonable."

    return {
        "trend": trend,
        "advice": advice,
        "trend_strength": round(trend_strength, 3),
        "momentum_7d": round(roc_7, 2),
        "momentum_14d": round(roc_14, 2),
        "short_term_avg": round(float(short_avg), 2),
        "long_term_avg": round(float(long_avg), 2),
        "ema_signal": round(signal, 2),
    }

"""
Monte Carlo simulation engine for sell-decision analysis.
Uses geometric Brownian motion for realistic price path simulation.
"""
import numpy as np
from typing import Dict
from app.core.market_projection import load_market_data


NUM_SIMULATIONS = 500  # Fast enough (~5ms) yet statistically robust


def monte_carlo_projection(
    prices: np.ndarray,
    days_ahead: int,
    num_sims: int = NUM_SIMULATIONS
) -> Dict:
    """
    Simulate future price paths using geometric Brownian motion.

    Returns mean, P10, P50, P90 projected prices.
    Vectorized with NumPy for speed.
    """
    # Calculate daily log returns from recent data
    recent = prices[-min(60, len(prices)):]
    log_returns = np.diff(np.log(recent))

    mu = np.mean(log_returns)       # drift
    sigma = np.std(log_returns)     # volatility
    last_price = float(prices[-1])

    # Vectorized simulation: (num_sims x days_ahead) random matrix
    random_shocks = np.random.normal(
        loc=mu - 0.5 * sigma**2,
        scale=sigma,
        size=(num_sims, days_ahead)
    )

    # Cumulative product for price paths
    price_paths = last_price * np.exp(np.cumsum(random_shocks, axis=1))

    # Final prices (last column of each path)
    final_prices = price_paths[:, -1]

    return {
        "mean": round(float(np.mean(final_prices)), 2),
        "median": round(float(np.median(final_prices)), 2),
        "p10": round(float(np.percentile(final_prices, 10)), 2),
        "p90": round(float(np.percentile(final_prices, 90)), 2),
        "std": round(float(np.std(final_prices)), 2),
        "prob_higher": round(float(np.mean(final_prices > last_price) * 100), 1),
    }


def simulate_sell_decision(
    csv_path: str,
    sell_after_days: int,
    base_confidence: float
) -> Dict:
    """
    Monte Carlo-based sell decision simulation.

    Uses geometric Brownian motion instead of simple linear extrapolation.
    Provides risk-aware projections with confidence bounds.
    """
    df = load_market_data(csv_path)
    prices = df["price"].values

    current_price = float(prices[-1])

    # Monte Carlo projection
    mc = monte_carlo_projection(prices, sell_after_days)

    projected_price = mc["mean"]
    percent_change = ((projected_price - current_price) / current_price) * 100
    price_difference = projected_price - current_price

    # Confidence adjustment based on Monte Carlo probability
    prob_gain = mc["prob_higher"]
    projection_adjustment = (prob_gain - 50) * 0.6  # Scale: ±30 max
    adjusted_confidence = base_confidence + projection_adjustment
    adjusted_confidence = max(0, min(100, adjusted_confidence))

    # Recommendation with uncertainty awareness
    if percent_change > 5 and prob_gain > 65:
        recommendation = f"Waiting {sell_after_days} days has {prob_gain:.0f}% chance of profit — likely beneficial"
    elif percent_change > 2 and prob_gain > 55:
        recommendation = f"Moderate gain expected with {prob_gain:.0f}% probability if waiting {sell_after_days} days"
    elif percent_change > 0 and prob_gain > 50:
        recommendation = f"Slight gain possible ({prob_gain:.0f}% probability) — marginal benefit of waiting"
    elif prob_gain < 40:
        recommendation = "Selling now is safer — market shows downward pressure"
    else:
        recommendation = "Market is uncertain — consider selling a portion now"

    return {
        "current_price": round(current_price, 2),
        "projected_price": projected_price,
        "projected_price_p10": mc["p10"],
        "projected_price_p90": mc["p90"],
        "prob_price_increase": prob_gain,
        "expected_profit_change_percent": round(percent_change, 2),
        "price_difference": round(price_difference, 2),
        "base_confidence": round(base_confidence, 2),
        "projection_adjustment": round(projection_adjustment, 2),
        "adjusted_confidence": round(adjusted_confidence, 2),
        "recommendation": recommendation,
    }


def simulate_with_storage_cost(csv_path: str, days: int, storage_cost_per_day: float):
    """Simulation that accounts for storage costs."""
    from app.core.market_projection import generate_market_projection

    projection = generate_market_projection(csv_path)

    current_price = projection["current_price"]
    projected_price = projection["projection_7_days"]

    storage_cost = storage_cost_per_day * days
    adjusted_projected = projected_price - storage_cost

    profit_change = ((adjusted_projected - current_price) / current_price) * 100

    return {
        "current_price": current_price,
        "projected_price_after_storage": round(adjusted_projected, 2),
        "storage_cost_total": round(storage_cost, 2),
        "net_profit_percent": round(profit_change, 2),
    }

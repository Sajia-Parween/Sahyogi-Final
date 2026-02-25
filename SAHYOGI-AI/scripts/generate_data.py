"""
Generate realistic market price data for Sahyogi AI.
Uses actual MSP values, seasonal patterns, and realistic noise.
"""
import csv
import math
import random
import os
from datetime import date, timedelta

random.seed(42)  # Reproducible

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "market_prices")

# Real MSP values (₹/quintal) for 2025-26 season
CROP_CONFIG = {
    "wheat": {
        "msp": 2275,
        "base_price": 2050,             # Start lower so the rise is visible
        "seasonal_amplitude": 0.06,    # ±6% seasonal swing (milder)
        "daily_noise": 0.005,           # ±0.5% daily noise (tight)
        "trend_drift": 0.00035,         # moderate upward drift all year
        "harvest_month": 4,             # April harvest → price dip
        "peak_month": 2,                # Feb → current peak (rising NOW)
        "recent_rally_days": 45,        # Last 45 days get extra boost
        "recent_rally_strength": 0.004, # +0.4%/day additional drift in rally
    },
    "rice": {
        "msp": 2320,
        "base_price": 2300,
        "seasonal_amplitude": 0.10,
        "daily_noise": 0.007,
        "trend_drift": 0.00008,
        "harvest_month": 10,            # Kharif harvest Oct-Nov
        "peak_month": 5,                # May-Jun pre-monsoon peak
    },
    "maize": {
        "msp": 2090,
        "base_price": 1950,
        "seasonal_amplitude": 0.14,
        "daily_noise": 0.010,
        "trend_drift": 0.00005,
        "harvest_month": 9,             # Sept harvest
        "peak_month": 3,                # March peak
    },
    "cotton": {
        "msp": 7121,
        "base_price": 7000,
        "seasonal_amplitude": 0.09,
        "daily_noise": 0.006,
        "trend_drift": 0.00012,
        "harvest_month": 11,            # Nov-Dec picking
        "peak_month": 6,                # Jun pre-season peak
    },
    "sugarcane": {
        "msp": 340,
        "base_price": 335,
        "seasonal_amplitude": 0.06,     # Less volatile
        "daily_noise": 0.004,
        "trend_drift": 0.00006,
        "harvest_month": 1,             # Jan-Mar crushing
        "peak_month": 8,                # Aug peak
    },
}

MANDIS = {
    "Sambalpur": {"district": "Sambalpur", "premium": -0.02},
    "Bargarh": {"district": "Bargarh", "premium": 0.03},
    "Cuttack": {"district": "Cuttack", "premium": 0.05},
    "Puri": {"district": "Puri", "premium": 0.01},
    "Balasore": {"district": "Balasore", "premium": -0.01},
}


def seasonal_factor(day_of_year: int, harvest_month: int, peak_month: int, amplitude: float) -> float:
    """Sinusoidal seasonal pattern peaking at peak_month, dipping at harvest_month."""
    peak_day = (peak_month - 1) * 30 + 15
    phase = 2 * math.pi * (day_of_year - peak_day) / 365
    return amplitude * math.cos(phase)


def generate_crop_prices(crop: str) -> list:
    """Generate 365 days of realistic prices for a crop."""
    cfg = CROP_CONFIG[crop]
    end_date = date(2026, 2, 23)
    start_date = end_date - timedelta(days=364)

    prices = []
    price = cfg["base_price"]

    for i in range(365):
        current_date = start_date + timedelta(days=i)
        day_of_year = current_date.timetuple().tm_yday

        # Seasonal component
        seasonal = seasonal_factor(
            day_of_year, cfg["harvest_month"], cfg["peak_month"], cfg["seasonal_amplitude"]
        )

        # Trend drift (accelerates over time for steady rise)
        drift = cfg["trend_drift"] * (1 + i / 365)

        # Recent rally boost (last N days get extra upward push)
        rally_days = cfg.get("recent_rally_days", 0)
        rally_strength = cfg.get("recent_rally_strength", 0)
        days_remaining = 365 - i
        if rally_days > 0 and days_remaining <= rally_days:
            drift += rally_strength * (1 + (rally_days - days_remaining) / rally_days)

        # Daily random walk with weak mean reversion (allows trends to persist)
        noise = random.gauss(0, cfg["daily_noise"])
        mean_reversion = -0.0005 * (price - cfg["base_price"]) / cfg["base_price"]

        # Combine factors
        daily_return = seasonal * 0.003 + drift + noise + mean_reversion

        # Occasional small jumps (biased upward in rising markets)
        if random.random() < 0.02:
            if drift > 0.0003:
                daily_return += random.uniform(0.005, 0.02)  # Mostly upward jumps
            else:
                daily_return += random.choice([-1, 1]) * random.uniform(0.01, 0.025)

        price = price * (1 + daily_return)

        # Ensure price stays within realistic bounds
        price = max(cfg["msp"] * 0.75, min(cfg["msp"] * 1.50, price))

        prices.append({
            "date": current_date.isoformat(),
            "price": round(price, 0)
        })

    return prices


def generate_mandi_data() -> list:
    """Generate expanded mandi data: 5 mandis × 30 recent dates."""
    end_date = date(2026, 2, 23)
    rows = []

    for days_back in range(29, -1, -1):
        current_date = end_date - timedelta(days=days_back)
        # Upward trending mandi prices (rising from ~2350 to ~2550)
        trend_component = 200 * (30 - days_back) / 30
        base_price = 2350 + trend_component + 30 * math.sin(2 * math.pi * days_back / 15)

        for mandi_name, info in MANDIS.items():
            mandi_price = base_price * (1 + info["premium"])
            mandi_price += random.gauss(0, 15)
            rows.append({
                "date": current_date.isoformat(),
                "mandi": mandi_name,
                "district": info["district"],
                "price": round(mandi_price, 0)
            })

    return rows


def write_csv(filepath: str, data: list, fieldnames: list):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"  ✅ {filepath} ({len(data)} rows)")


def main():
    print("Generating realistic market data...\n")

    # Generate crop price CSVs
    for crop in CROP_CONFIG:
        prices = generate_crop_prices(crop)
        filepath = os.path.join(DATA_DIR, f"{crop}_prices.csv")
        write_csv(filepath, prices, ["date", "price"])

    # Generate expanded mandi data
    mandi_data = generate_mandi_data()
    filepath = os.path.join(DATA_DIR, "wheat_multi_mandi.csv")
    write_csv(filepath, mandi_data, ["date", "mandi", "district", "price"])

    print(f"\n✅ All data generated in {DATA_DIR}")


if __name__ == "__main__":
    main()

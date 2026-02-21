import csv
from statistics import mean
from typing import Dict


def load_market_prices(file_path: str) -> list:
    """
    Load historical market prices from CSV file.
    Expected format:
    date,price
    2026-01-01,2100
    """
    prices = []

    with open(file_path, mode="r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            prices.append(float(row["price"]))

    return prices


def analyze_market_trend(prices: list) -> Dict:
    """
    Compare short-term and long-term averages
    to determine price trend.
    """

    if len(prices) < 30:
        return {
            "trend": "insufficient_data",
            "advice": "Not enough market data to determine trend."
        }

    short_term_avg = mean(prices[-7:])
    long_term_avg = mean(prices[-30:])

    if short_term_avg > long_term_avg:
        return {
            "trend": "rising",
            "advice": "Market prices are rising. You may consider waiting before selling."
        }
    elif short_term_avg < long_term_avg:
        return {
            "trend": "falling",
            "advice": "Market prices are declining. Selling soon may reduce risk."
        }
    else:
        return {
            "trend": "stable",
            "advice": "Market prices are stable. Selling now is reasonable."
        }

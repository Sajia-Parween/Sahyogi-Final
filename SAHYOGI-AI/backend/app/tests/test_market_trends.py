from app.core.market_trends import analyze_market_trend


def test_market_trend_rising():
    prices = list(range(2000, 2035))  # rising trend
    result = analyze_market_trend(prices)

    assert result["trend"] == "rising"

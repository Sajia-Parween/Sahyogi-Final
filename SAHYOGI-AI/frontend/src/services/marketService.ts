export function generateMarketData() {
  const basePrice = 1900;

  const prices = Array.from({ length: 7 }, () =>
    basePrice + Math.floor(Math.random() * 200 - 100)
  );

  const trend =
    prices[6] > prices[0] ? "Upward 📈" : "Downward 📉";

  const average =
    prices.reduce((a, b) => a + b, 0) / prices.length;

  const prediction = Math.round(average + 50);

  return {
    prices,
    trend,
    prediction,
  };
}
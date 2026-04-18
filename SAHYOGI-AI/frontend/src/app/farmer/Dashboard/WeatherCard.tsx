"use client";

import { useEffect, useState, useCallback } from "react";

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  condition: string;
  high: number;
  low: number;
  uv_index: number;
  icon: string;
  location: string;
  sunrise: string;
  sunset: string;
}

const WEATHER_ICONS: Record<string, string> = {
  "Clear sky": "☀️",
  "Mainly clear": "🌤️",
  "Partly cloudy": "⛅",
  "Overcast": "☁️",
  "Fog": "🌫️",
  "Light drizzle": "🌦️",
  "Moderate drizzle": "🌧️",
  "Light rain": "🌦️",
  "Moderate rain": "🌧️",
  "Heavy rain": "⛈️",
  "Thunderstorm": "⛈️",
  "Light snow": "🌨️",
  "Heavy snow": "❄️",
};

// WMO Weather interpretation codes → readable conditions
function wmoToCondition(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Light snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Light rain", 81: "Moderate rain", 82: "Heavy rain",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
  };
  return map[code] || "Partly cloudy";
}

// Sambalpur, Odisha coords (farmer's default region)
const DEFAULT_LAT = 21.4669;
const DEFAULT_LON = 83.9812;
const LOCATION_NAME = "Sambalpur, Odisha";

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia%2FKolkata&forecast_days=1`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API unavailable");
      const data = await res.json();

      const current = data.current;
      const daily = data.daily;
      const condStr = wmoToCondition(current.weather_code);

      setWeather({
        temp: Math.round(current.temperature_2m),
        feels_like: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind_speed: Math.round(current.wind_speed_10m),
        rainfall: current.precipitation,
        condition: condStr,
        high: Math.round(daily.temperature_2m_max[0]),
        low: Math.round(daily.temperature_2m_min[0]),
        uv_index: Math.round(current.uv_index),
        icon: WEATHER_ICONS[condStr] || "🌤️",
        location: LOCATION_NAME,
        sunrise: new Date(daily.sunrise[0]).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        sunset: new Date(daily.sunset[0]).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      });

      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      setError(null);
    } catch (err) {
      setError("Unable to fetch weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Gradient based on condition
  const getGradient = () => {
    if (!weather) return "from-[#2D5A27] to-[#4A7c44]";
    const c = weather.condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return "from-[#1a3a4a] to-[#2d5a6a]";
    if (c.includes("thunder")) return "from-[#1a1a3a] to-[#3a2a5a]";
    if (c.includes("cloud") || c.includes("overcast")) return "from-[#2a3a4a] to-[#4a5a6a]";
    if (c.includes("fog")) return "from-[#3a3a3a] to-[#5a5a5a]";
    return "from-[#2D5A27] to-[#4A7c44]"; // sunny/clear
  };

  // UV level tag
  const getUvLevel = (uv: number) => {
    if (uv <= 2) return { label: "Low", color: "bg-green-400/20 text-green-300" };
    if (uv <= 5) return { label: "Moderate", color: "bg-yellow-400/20 text-yellow-300" };
    if (uv <= 7) return { label: "High", color: "bg-orange-400/20 text-orange-300" };
    return { label: "Very High", color: "bg-red-400/20 text-red-300" };
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${getGradient()} text-white p-8 rounded-[2rem] shadow-2xl border border-white/10`}>

      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-400/5 rounded-full blur-3xl"></div>

      {loading && !weather && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="ml-3 text-white/60 font-medium">Fetching live weather...</span>
        </div>
      )}

      {error && !weather && (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">⚠️</span>
          <p className="text-white/60 font-medium">{error}</p>
          <button onClick={fetchWeather} className="mt-3 bg-white/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
            Retry
          </button>
        </div>
      )}

      {weather && (
        <>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white/80 uppercase tracking-widest text-xs font-bold">
                  Live Weather
                </p>
                <span className="bg-green-400/20 text-green-300 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                  Real-time
                </span>
              </div>
              <p className="text-white/50 text-xs font-medium mb-4">📍 {weather.location}</p>

              <div className="flex items-baseline gap-3">
                <h1 className="text-7xl font-extrabold tracking-tighter">
                  {weather.temp}°
                </h1>
                <div>
                  <span className="text-xl text-white/70 font-medium block">{weather.condition}</span>
                  <span className="text-xs text-white/40">Feels like {weather.feels_like}°C</span>
                </div>
              </div>

              {/* Stats pills */}
              <div className="flex flex-wrap gap-2.5 mt-6">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">💧</span>
                  <span className="text-white/60 text-[10px] uppercase font-bold">Humidity</span>
                  <span className="font-semibold text-sm">{weather.humidity}%</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">🌧️</span>
                  <span className="text-white/60 text-[10px] uppercase font-bold">Rain</span>
                  <span className="font-semibold text-sm">{weather.rainfall} mm</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                  <span className="text-sm">💨</span>
                  <span className="text-white/60 text-[10px] uppercase font-bold">Wind</span>
                  <span className="font-semibold text-sm">{weather.wind_speed} km/h</span>
                </div>
                {weather.uv_index > 0 && (
                  <div className={`backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2 ${getUvLevel(weather.uv_index).color}`}>
                    <span className="text-sm">☀️</span>
                    <span className="text-[10px] uppercase font-bold opacity-70">UV</span>
                    <span className="font-semibold text-sm">{weather.uv_index} ({getUvLevel(weather.uv_index).label})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Large weather icon */}
            <div className="text-right flex-shrink-0">
              <div className="text-8xl filter drop-shadow-lg" style={{ animation: "float 3s ease-in-out infinite" }}>
                {weather.icon}
              </div>
              <div className="mt-3 space-y-1 text-xs text-white/40">
                <p>🌅 {weather.sunrise}</p>
                <p>🌇 {weather.sunset}</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
            <div className="flex items-center gap-4">
              <span>↑ High: {weather.high}° • ↓ Low: {weather.low}°</span>
              {weather.rainfall > 0 && (
                <span className="bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full text-[9px] font-bold">
                  🌧 Rain Alert
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>Updated: {lastUpdated}</span>
              <button onClick={fetchWeather} className="hover:text-white/80 transition-colors font-bold">
                🔄
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
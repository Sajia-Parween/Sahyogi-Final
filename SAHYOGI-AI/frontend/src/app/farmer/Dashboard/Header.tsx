"use client";

import { useEffect, useState } from "react";
import { useFarmer } from "../../../context/FarmerContext";

export default function Header() {
  const { farmer, logout } = useFarmer();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  const farmerName = farmer?.name || "Farmer";
  const initials = farmerName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="w-full bg-[#1A3317] text-white p-4 rounded-2xl shadow-xl border border-white/5 flex justify-between items-center mb-6">

      {/* Left Side: Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="bg-green-500/20 p-2 rounded-lg">
          <span className="text-2xl">🌿</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Sahyogi <span className="text-green-400 font-medium">Dashboard</span>
          </h1>
          <p className="text-xs text-white/50 font-medium">
            Welcome back, {farmerName}
          </p>
        </div>
      </div>

      {/* Right Side: Date and User Profile */}
      <div className="flex items-center gap-6">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-white/70 text-sm font-medium">
          <span>📅</span>
          <span>{currentDate}</span>
        </div>

        {/* User Profile Component */}
        <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-all cursor-pointer p-1.5 pr-4 rounded-full border border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-[#1A3317] flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none">{farmerName}</span>
            <span className="text-[10px] text-green-400 font-semibold">
              {farmer?.crop ? `Growing ${farmer.crop}` : "Premium Member"}
            </span>
          </div>
          <span className="text-[10px] ml-2 opacity-50">▼</span>
        </div>
      </div>
    </header>
  );
}
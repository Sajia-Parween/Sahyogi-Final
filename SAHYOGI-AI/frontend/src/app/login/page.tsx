"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFarmer } from "../../services/api";
import { useFarmer } from "../../context/FarmerContext";
import { useLanguage } from "../../context/LanguageContext";
import type { Language } from "../../context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { setFarmer, setPhone } = useFarmer();
  const { setLanguage } = useLanguage();

  const [phone, setPhoneInput] = useState("");
  const [language, setLangSelect] = useState("Hindi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const langMap: Record<string, Language> = {
    Hindi: "hi",
    English: "en",
    Odia: "od",
  };

  const handleLogin = async () => {
    if (!phone) {
      setError("Please enter phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getFarmer(phone);
      const farmerData = res.data || res;

      if (!farmerData || farmerData.error) {
        setError("Farmer not found. Please check your phone number.");
        return;
      }

      // Store farmer data in context
      setPhone(phone);
      setFarmer({
        id: farmerData.id,
        phone: farmerData.phone || phone,
        name: farmerData.name,
        language: farmerData.language || langMap[language] || "en",
        crop: farmerData.crop,
        sowing_date: farmerData.sowing_date,
      });

      // Store language preference
      setLanguage(langMap[language] || "en");

      router.push("/farmer");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E2E8F0] bg-[radial-gradient(circle_at_top,_#F1F5F9_0%,_#E2E8F0_100%)] p-4">

      {/* Main Container - Split Layout */}
      <div className="flex bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden w-full max-w-4xl min-h-[550px] border border-white">

        {/* Left Side: Visual/Branding */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#1A3317]">
          <img
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000"
            alt="Agriculture background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="relative z-10 p-12 flex flex-col justify-between text-white">
            <div>
              <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🌿
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                Empowering <br />
                <span className="text-green-400">Indian Farmers</span>
              </h1>
            </div>
            <p className="text-green-100/80 text-sm font-medium italic">
              &quot;Smart farming solutions for a sustainable future.&quot;
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
              Sahyogi <span className="text-green-600">Login</span>
            </h2>
            <p className="text-gray-500 font-medium">Welcome back! Please enter your details.</p>
          </div>

          <div className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Phone Input */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                <input
                  type="tel"
                  placeholder="Enter your mobile"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-14 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-800 font-medium"
                  value={phone}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Preferred Language
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-800 font-medium appearance-none cursor-pointer"
                value={language}
                onChange={(e) => setLangSelect(e.target.value)}
              >
                <option>Hindi</option>
                <option>English</option>
                <option>Odia</option>
              </select>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 ${loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                "Access Dashboard"
              )}
            </button>

            <p className="text-center text-xs text-gray-400 font-medium mt-6">
              By logging in, you agree to our <span className="text-green-600 underline cursor-pointer">Terms of Service</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
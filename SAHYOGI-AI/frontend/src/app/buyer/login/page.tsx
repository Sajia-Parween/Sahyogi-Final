"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { loginBuyer, registerBuyer } from "../../../services/api";
import { useBuyer } from "../../../context/BuyerContext";

const CROP_OPTIONS = ["tomato", "wheat", "rice", "maize", "cotton", "onion", "potato", "sugarcane", "mustard", "soybean", "groundnut", "chilli"];

export default function BuyerLoginPage() {
    const router = useRouter();
    const { setBuyer, setPhone } = useBuyer();

    const [mode, setMode] = useState<"login" | "register">("login");
    const [phone, setPhoneInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Registration fields
    const [name, setName] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("Sambalpur");
    const [cropsBuying, setCropsBuying] = useState<string[]>([]);
    const [priceMin, setPriceMin] = useState(10);
    const [priceMax, setPriceMax] = useState(30);
    const [maxQty, setMaxQty] = useState(5000);
    const [paymentSpeed, setPaymentSpeed] = useState("3_days");
    const [businessType, setBusinessType] = useState("wholesaler");
    const [description, setDescription] = useState("");

    const toggleCrop = (crop: string) => {
        setCropsBuying((prev) =>
            prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
        );
    };

    const handleLogin = async () => {
        if (!phone || phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await loginBuyer(phone);
            const buyerData = res.data || res;

            if (!buyerData || buyerData.error) {
                setError("Buyer not found. Please register first.");
                return;
            }

            setPhone(phone);
            setBuyer(buyerData);
            router.push("/buyer");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Login failed. Check your phone number.";
            if (msg.includes("not found")) {
                setError("Buyer not found. Please register first.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!phone || phone.length < 10) { setError("Valid phone number required"); return; }
        if (!name) { setError("Name is required"); return; }
        if (cropsBuying.length === 0) { setError("Select at least one crop you buy"); return; }

        setLoading(true);
        setError("");

        try {
            const res = await registerBuyer({
                phone,
                name,
                business_name: businessName || name,
                email,
                location,
                crops_buying: cropsBuying,
                price_range: { min: priceMin, max: priceMax },
                max_quantity_kg: maxQty,
                payment_speed: paymentSpeed,
                business_type: businessType,
                description,
            });

            const buyerData = res.data || res;
            if (buyerData.error) {
                setError(buyerData.error);
                return;
            }

            setPhone(phone);
            setBuyer(buyerData);
            router.push("/buyer");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#E2E8F0] bg-[radial-gradient(circle_at_top,_#F1F5F9_0%,_#E2E8F0_100%)] p-4">
            <div className="flex bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden w-full max-w-5xl min-h-[550px] border border-white">
                {/* Left Side — Branding */}
                <div className="hidden md:flex md:w-5/12 relative overflow-hidden bg-[#1A2332]">
                    <img
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"
                        alt="Market background"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="relative z-10 p-12 flex flex-col justify-between text-white">
                        <div>
                            <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6">
                                🏪
                            </div>
                            <h1 className="text-4xl font-black tracking-tight leading-tight">
                                Connect with <br />
                                <span className="text-emerald-400">Indian Farmers</span>
                            </h1>
                            <p className="mt-4 text-white/60 text-sm leading-relaxed">
                                Buy directly from verified farmers. Get fresh produce at fair prices with Sahyogi&apos;s intelligent matching.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-white/70 text-sm">
                                <span className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-xs">✓</span>
                                Direct farmer connections
                            </div>
                            <div className="flex items-center gap-3 text-white/70 text-sm">
                                <span className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-xs">✓</span>
                                AI-matched supply requests
                            </div>
                            <div className="flex items-center gap-3 text-white/70 text-sm">
                                <span className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-xs">✓</span>
                                Real-time demand analytics
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side — Form */}
                <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
                    <div className="mb-6 text-center md:text-left">
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-1">
                            Buyer <span className="text-emerald-600">{mode === "login" ? "Login" : "Registration"}</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-sm">
                            {mode === "login" ? "Welcome back! Enter your phone to continue." : "Create your buyer account to start receiving crop requests."}
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => { setMode("login"); setError(""); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "login" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === "register" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Phone */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                                <input
                                    type="tel"
                                    placeholder="Enter your mobile"
                                    value={phone}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleLogin()}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 pl-14 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-gray-800 font-medium text-sm"
                                />
                            </div>
                        </div>

                        {mode === "register" && (
                            <>
                                {/* Name + Business */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                                        <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Business Name</label>
                                        <input type="text" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm" />
                                    </div>
                                </div>

                                {/* Email + Location */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                        <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Location</label>
                                        <select value={location} onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm">
                                            {["Sambalpur", "Bargarh", "Jharsuguda", "Rairakhol", "Attabira"].map((l) => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Crops */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Crops You Buy *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CROP_OPTIONS.map((crop) => (
                                            <button key={crop} onClick={() => toggleCrop(crop)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${cropsBuying.includes(crop) ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                                                {crop.charAt(0).toUpperCase() + crop.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price + Qty */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Min Price (₹/kg)</label>
                                        <input type="number" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Max Price (₹/kg)</label>
                                        <input type="number" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Max Qty (kg)</label>
                                        <input type="number" value={maxQty} onChange={(e) => setMaxQty(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm" />
                                    </div>
                                </div>

                                {/* Payment + Type */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Speed</label>
                                        <select value={paymentSpeed} onChange={(e) => setPaymentSpeed(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 outline-none text-gray-800 font-medium text-sm">
                                            <option value="instant">Instant (UPI)</option>
                                            <option value="next_day">Next Day</option>
                                            <option value="3_days">3 Days</option>
                                            <option value="weekly">Weekly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Business Type</label>
                                        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 outline-none text-gray-800 font-medium text-sm">
                                            <option value="wholesaler">Wholesaler</option>
                                            <option value="exporter">Exporter</option>
                                            <option value="retail_chain">Retail Chain</option>
                                            <option value="aggregator">Aggregator</option>
                                            <option value="b2b_marketplace">B2B Marketplace</option>
                                            <option value="processor">Processor</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                    <textarea rows={2} placeholder="Tell farmers about your business..." value={description} onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-800 font-medium text-sm resize-none" />
                                </div>
                            </>
                        )}

                        {/* Submit */}
                        <button
                            onClick={mode === "login" ? handleLogin : handleRegister}
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all mt-2 ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:scale-[1.02] active:scale-95 shadow-emerald-500/20"}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {mode === "login" ? "Verifying..." : "Registering..."}
                                </span>
                            ) : (
                                mode === "login" ? "Access Buyer Dashboard" : "Create Account & Continue"
                            )}
                        </button>

                        {/* Demo accounts info */}
                        {mode === "login" && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-2">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Demo Buyer Accounts</p>
                                <div className="space-y-1 text-xs text-gray-600 font-medium">
                                    <p><span className="text-gray-800 font-bold">9000000001</span> — GreenHarvest Exports</p>
                                    <p><span className="text-gray-800 font-bold">9000000002</span> — Odisha FreshMart</p>
                                    <p><span className="text-gray-800 font-bold">9000000003</span> — KisanDirect Pvt Ltd</p>
                                </div>
                            </div>
                        )}

                        <Link href="/login" className="block text-center text-xs text-gray-400 font-medium hover:text-emerald-600 transition-colors mt-2">
                            ← Back to Farmer Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

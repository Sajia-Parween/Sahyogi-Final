"use client";

import { useState } from "react";

interface CallScreenProps {
    onStartCall: (phone: string) => void;
    loading: boolean;
}

export default function CallScreen({ onStartCall, loading }: CallScreenProps) {
    const [phone, setPhone] = useState("");

    const handleCall = () => {
        if (!phone.trim()) return;
        onStartCall(phone.trim());
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
            {/* Animated rings around call icon */}
            <div className="relative">
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-500/10 animate-ping" />
                <div className="absolute inset-2 w-28 h-28 rounded-full bg-green-500/20 animate-pulse" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-2xl shadow-green-500/30">
                    <span className="text-5xl">📞</span>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-2xl font-black text-white mb-2">Start IVR Call</h2>
                <p className="text-white/40 text-sm font-medium">
                    Enter phone number to begin voice advisory
                </p>
            </div>

            {/* Phone Input */}
            <div className="w-full max-w-xs">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-bold text-sm">
                        +91
                    </span>
                    <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCall()}
                        suppressHydrationWarning
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-14 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Call Button */}
            <button
                onClick={handleCall}
                disabled={loading || !phone.trim()}
                className={`w-64 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${loading || !phone.trim()
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-105 shadow-green-500/25"
                    }`}
            >
                {loading ? (
                    <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                    </>
                ) : (
                    <>
                        <span className="text-xl">📞</span>
                        Start Call
                    </>
                )}
            </button>
        </div>
    );
}

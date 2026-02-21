"use client";

interface IVRKeypadProps {
    onPress: (key: number) => void;
    disabled: boolean;
}

const keys = [
    { num: 1, label: "Crop Advisory", icon: "🌾", color: "from-green-500 to-green-600" },
    { num: 2, label: "Market Prices", icon: "📊", color: "from-blue-500 to-blue-600" },
    { num: 3, label: "AI Chat", icon: "🤖", color: "from-purple-500 to-purple-600" },
    { num: 4, label: "Sell Simulation", icon: "💰", color: "from-amber-500 to-amber-600" },
];

export default function IVRKeypad({ onPress, disabled }: IVRKeypadProps) {
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
                {keys.map((key) => (
                    <button
                        key={key.num}
                        onClick={() => onPress(key.num)}
                        disabled={disabled}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 active:scale-95 ${disabled
                                ? "bg-white/5 cursor-not-allowed opacity-50"
                                : "bg-white/5 hover:bg-white/10 hover:scale-105 border border-white/10 hover:border-white/20"
                            }`}
                    >
                        {/* Glow effect on hover */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${key.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                        />

                        <div className="relative z-10 flex flex-col items-center gap-3">
                            {/* Number badge */}
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${key.color} flex items-center justify-center shadow-lg`}
                            >
                                <span className="text-white font-black text-lg">{key.num}</span>
                            </div>

                            {/* Icon */}
                            <span className="text-2xl">{key.icon}</span>

                            {/* Label */}
                            <span className="text-white/70 text-xs font-bold uppercase tracking-wider text-center">
                                {key.label}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Repeat menu button */}
            <button
                onClick={() => onPress(0)}
                disabled={disabled}
                className="w-full mt-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white/70 transition-all active:scale-95"
            >
                Press 0 — Repeat Menu
            </button>
        </div>
    );
}

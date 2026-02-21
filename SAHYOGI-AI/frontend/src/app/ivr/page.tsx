"use client";

import { useState } from "react";
import { useIVR } from "../../hooks/useIVR";
import CallScreen from "../../components/CallScreen";
import IVRKeypad from "../../components/IVRKeypad";
import IVRMenu from "../../components/IVRMenu";
import Link from "next/link";

export default function IvrPage() {
    const ivr = useIVR();
    const [phone, setPhone] = useState("");

    const handleStartCall = (p: string) => {
        setPhone(p);
        ivr.startCall(p);
    };

    const handleKeyPress = (key: number) => {
        switch (key) {
            case 1:
                ivr.showAdvisory();
                break;
            case 2:
                ivr.showMarket();
                break;
            case 3:
                ivr.goToChat();
                break;
            case 4:
                ivr.goToSimulation();
                break;
            case 0:
                ivr.backToMenu();
                break;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_#0f1f0a_0%,_#0a0a0a_60%)] flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg shadow-green-500/20" />
                    <h1 className="text-xl font-black text-white tracking-tight">
                        Sahyogi<span className="text-green-500">.</span>{" "}
                        <span className="text-white/40 font-medium">IVR</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/farmer"
                        className="text-white/40 text-xs font-bold uppercase tracking-wider hover:text-white/70 transition-colors"
                    >
                        ← Dashboard
                    </Link>

                    {ivr.state !== "idle" && (
                        <button
                            onClick={ivr.resetCall}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all active:scale-95"
                        >
                            End Call
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center px-6 py-10">
                {/* Status bar */}
                {ivr.state !== "idle" && (
                    <div className="flex items-center gap-3 mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                            {ivr.state === "calling"
                                ? "Connecting..."
                                : ivr.state === "menu"
                                    ? "Connected • Select an option"
                                    : `Active • ${ivr.state.charAt(0).toUpperCase() + ivr.state.slice(1)}`}
                        </span>
                        {(ivr.isPlaying || ivr.isSpeaking) && (
                            <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                <span className="inline-flex gap-[2px]">
                                    <span className="w-[3px] h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-[3px] h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-[3px] h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    <span className="w-[3px] h-5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                                    <span className="w-[3px] h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "250ms" }} />
                                </span>
                                {ivr.isSpeaking ? "🎤 Speaking..." : "🔊 Audio Playing"}
                            </span>
                        )}
                    </div>
                )}

                {/* Idle → Call Screen */}
                {ivr.state === "idle" && (
                    <CallScreen onStartCall={handleStartCall} loading={ivr.loading} />
                )}

                {/* Calling → Loading animation */}
                {ivr.state === "calling" && (
                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500/20 animate-ping" />
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-2xl shadow-green-500/30">
                                <span className="text-4xl animate-pulse">📞</span>
                            </div>
                        </div>
                        <p className="text-white/50 font-bold text-sm animate-pulse">
                            Connecting to Sahyogi advisory...
                        </p>
                    </div>
                )}

                {/* Menu → Show Keypad */}
                {ivr.state === "menu" && (
                    <div className="w-full max-w-md mx-auto space-y-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-white mb-2">
                                IVR Menu
                            </h2>
                            <p className="text-white/40 text-sm font-medium">
                                Select an option to continue
                            </p>
                        </div>
                        <IVRKeypad onPress={handleKeyPress} disabled={ivr.loading} />
                    </div>
                )}

                {/* Feature views */}
                {["advisory", "market", "chat", "simulation"].includes(ivr.state) && (
                    <IVRMenu
                        state={ivr.state}
                        data={ivr.data}
                        loading={ivr.loading}
                        error={ivr.error}
                        isPlaying={ivr.isPlaying}
                        phone={phone}
                        onSendChat={ivr.sendChat}
                        onRunSimulation={ivr.runSimulation}
                        onBack={ivr.backToMenu}
                        onPlayAudio={ivr.playAudio}
                        onStopAudio={ivr.stopAudio}
                    />
                )}

                {/* Global error */}
                {ivr.error && ivr.state === "idle" && (
                    <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm font-medium max-w-md text-center">
                        {ivr.error}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 border-t border-white/5">
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                    Sahyogi IVR System • Voice-First Advisory
                </p>
            </footer>
        </div>
    );
}

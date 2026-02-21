"use client";

import { useState, useRef } from "react";
import { useFarmer } from "../../../context/FarmerContext";
import { useChat } from "../../../hooks/useChat";
import { useLanguage } from "../../../context/LanguageContext";

export default function VoiceAssistant() {
  const { phone } = useFarmer();
  const { messages, loading, latestAudioUrl, sendMessage } = useChat();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(phone, input.trim());
    setInput("");
  };

  const handlePlayAudio = () => {
    if (!latestAudioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(latestAudioUrl);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.play().catch(() => setIsPlaying(false));
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const langMap: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    od: "Odia",
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col h-full transition-all hover:shadow-2xl">

      {/* Header with Icon */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
            <span className="text-xl">🎙️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            Voice Assistant
          </h2>
        </div>
        {loading && (
          <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
        )}
      </div>

      {/* Modern Search/Input Style */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Ask Sahyogi..."
          className="w-full bg-gray-50 border border-gray-200 p-4 pr-12 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
          suppressHydrationWarning
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm hover:bg-green-700 transition-colors disabled:opacity-40"
        >
          →
        </button>
      </div>

      {/* Chat Area */}
      <div className="space-y-4 flex-grow mb-6 max-h-[300px] overflow-y-auto">
        {messages.length === 0 ? (
          <>
            {/* Default placeholder messages */}
            <div className="flex justify-end">
              <div className="bg-[#E9F5E8] text-[#2D5A27] px-4 py-3 rounded-2xl rounded-tr-none text-sm font-medium shadow-sm flex items-center gap-2 border border-green-100">
                Forecast for 7 days please
                <span className="text-[10px] text-green-600">✔</span>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-50 text-gray-600 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-gray-100 shadow-sm italic">
                &quot;Here is the weather forecast for the next 7 days...&quot;
              </div>
            </div>
          </>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  msg.role === "user"
                    ? "bg-[#E9F5E8] text-[#2D5A27] px-4 py-3 rounded-2xl rounded-tr-none text-sm font-medium shadow-sm flex items-center gap-2 border border-green-100 max-w-[80%]"
                    : "bg-gray-50 text-gray-600 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-gray-100 shadow-sm max-w-[80%]"
                }
              >
                {msg.text}
                {msg.role === "user" && (
                  <span className="text-[10px] text-green-600">✔</span>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 text-gray-400 px-4 py-3 rounded-2xl rounded-tl-none text-sm border border-gray-100 shadow-sm italic flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></span>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="mt-auto">
        <button
          onClick={handlePlayAudio}
          disabled={!latestAudioUrl || isPlaying}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${latestAudioUrl && !isPlaying
            ? "bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] text-white shadow-green-900/20 hover:scale-[1.02] active:scale-95"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          <span>{isPlaying ? "Playing..." : "Play Audio"}</span>
          <span className="text-lg">{isPlaying ? "🔊" : "→"}</span>
        </button>

        {/* Language Selection - Modern Pill Style */}
        <div className="flex justify-center gap-6 mt-6">
          {['Hindi', 'English', 'Odia'].map((lang) => (
            <button
              key={lang}
              suppressHydrationWarning
              className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${langMap[language] === lang
                ? "text-green-600"
                : "text-gray-400 hover:text-green-600"
                }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
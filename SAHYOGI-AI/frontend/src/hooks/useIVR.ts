"use client";

import { useState, useCallback, useRef } from "react";
import { simulateCall, sendChatMessage, simulateSell, getAudioUrl } from "../services/api";

export type IVRState = "idle" | "calling" | "menu" | "advisory" | "market" | "chat" | "simulation";

export interface IVRData {
    callData: Record<string, any> | null;
    chatResponse: { text: string; audioUrl?: string } | null;
    simulationData: Record<string, any> | null;
}

// ─── TTS Helper ───
function speak(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.startsWith("en-IN"))
        || voices.find((v) => v.lang.startsWith("en"));

    if (preferred) utterance.voice = preferred;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

const MENU_PROMPT =
    "Welcome to Sahyogi IVR. Please select an option. " +
    "Press 1 for Crop Advisory. " +
    "Press 2 for Market Prices. " +
    "Press 3 for AI Chat Assistant. " +
    "Press 4 for Sell Simulation. " +
    "Press 0 to repeat this menu.";

export function useIVR() {
    const [state, setState] = useState<IVRState>("idle");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [data, setData] = useState<IVRData>({
        callData: null,
        chatResponse: null,
        simulationData: null,
    });
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsPlaying(false);
        stopSpeaking();
        setIsSpeaking(false);
    }, []);

    const playAudio = useCallback((url: string, onEnd?: () => void) => {
        stopAudio();
        const audio = new Audio(url);
        audioRef.current = audio;
        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));
        audio.onended = () => {
            setIsPlaying(false);
            if (onEnd) onEnd();
        };
        audio.onerror = () => setIsPlaying(false);
    }, [stopAudio]);

    // Speak the menu prompt
    const speakMenu = useCallback(() => {
        setIsSpeaking(true);
        speak(MENU_PROMPT, () => setIsSpeaking(false));
    }, []);

    // Start Call → POST /api/v1/calls/
    const startCall = useCallback(async (phone: string) => {
        setState("calling");
        setLoading(true);
        setError(null);

        try {
            const res = await simulateCall(phone);
            const callData = res.data || res;

            if (callData.audio_file) {
                callData.audio_file = getAudioUrl(callData.audio_file);
            }

            setData((prev) => ({ ...prev, callData }));
            setState("menu");

            // Speak the IVR menu prompt first — advisory audio plays only when user picks option 1
            speakMenu();
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err.message ||
                "Call failed"
            );
            setState("idle");
        } finally {
            setLoading(false);
        }
    }, [playAudio, speakMenu]);

    // Option 1: Advisory — play audio with TTS intro
    const showAdvisory = useCallback(() => {
        stopAudio();
        setState("advisory");
        const call = data.callData;

        speak("Here is your crop advisory.", () => {
            if (call?.audio_file) {
                playAudio(call.audio_file);
            }
        });
    }, [data.callData, playAudio, stopAudio]);

    // Option 2: Market — speak market data
    const showMarket = useCallback(() => {
        stopAudio();
        setState("market");
        const projection = data.callData?.market_projection;

        if (projection) {
            const text =
                `Market update. ` +
                `Current price is ${projection.current_price || "unavailable"} rupees per quintal. ` +
                (projection.trend ? `The market trend is ${projection.trend}. ` : "") +
                (projection.predicted_next
                    ? `The 7-day predicted price is ${projection.predicted_next} rupees. `
                    : "");
            speak(text);
        } else {
            speak("Market data is currently unavailable.");
        }
    }, [data.callData, stopAudio]);

    // Navigate to chat (with voice prompt)
    const goToChat = useCallback(() => {
        stopAudio();
        setState("chat");
        speak("AI Chat Assistant. Please type your question and press enter.");
    }, [stopAudio]);

    // Navigate to simulation (with voice prompt)
    const goToSimulation = useCallback(() => {
        stopAudio();
        setState("simulation");
        speak("Sell Simulation. Adjust the number of days and press the simulate button.");
    }, [stopAudio]);

    // Option 3: Chat — send message and speak response
    const sendChat = useCallback(async (phone: string, question: string) => {
        setState("chat");
        setLoading(true);
        setError(null);

        try {
            const res = await sendChatMessage(phone, question);
            const chatData = res.data || res;

            const audioUrl = chatData.audio_file
                ? getAudioUrl(chatData.audio_file)
                : undefined;

            setData((prev) => ({
                ...prev,
                chatResponse: {
                    text: chatData.text_response || "No response received.",
                    audioUrl,
                },
            }));

            // Play the response audio, or speak the text
            if (audioUrl) {
                playAudio(audioUrl);
            } else {
                speak(chatData.text_response || "No response received.");
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message || err.message || "Chat failed"
            );
        } finally {
            setLoading(false);
        }
    }, [playAudio]);

    // Option 4: Sell Simulation
    const runSimulation = useCallback(async (phone: string, days: number) => {
        setState("simulation");
        setLoading(true);
        setError(null);

        try {
            const res = await simulateSell(phone, days);
            const simData = res.data || res;
            setData((prev) => ({ ...prev, simulationData: simData }));

            // Speak the simulation result
            const result = simData?.simulation_result;
            if (result) {
                const text =
                    `Simulation result for selling after ${days} days. ` +
                    (result.predicted_price
                        ? `Predicted price is ${result.predicted_price} rupees. `
                        : "") +
                    (result.recommendation || "");
                speak(text);
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.detail || err.message || "Simulation failed"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // Back to menu — speak menu again
    const backToMenu = useCallback(() => {
        stopAudio();
        setError(null);
        setState("menu");
        speakMenu();
    }, [stopAudio, speakMenu]);

    // Reset to idle
    const resetCall = useCallback(() => {
        stopAudio();
        setState("idle");
        setError(null);
        setData({ callData: null, chatResponse: null, simulationData: null });
    }, [stopAudio]);

    return {
        state,
        loading,
        error,
        data,
        isPlaying,
        isSpeaking,
        startCall,
        showAdvisory,
        showMarket,
        sendChat,
        goToChat,
        runSimulation,
        goToSimulation,
        backToMenu,
        resetCall,
        playAudio,
        stopAudio,
        speakMenu,
    };
}

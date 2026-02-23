"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionOptions {
    lang?: string;
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
}

// Extend Window to include webkitSpeechRecognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

export function useSpeechRecognition({
    lang = "en-IN",
    onResult,
    onError,
}: UseSpeechRecognitionOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Check browser support on mount
    useEffect(() => {
        const supported =
            typeof window !== "undefined" &&
            ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
        setIsSupported(supported);
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) {
            onError?.("Speech recognition is not supported in this browser.");
            return;
        }

        // Stop any existing instance
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = false; // Single phrase
        recognition.interimResults = true; // Show live transcript
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript("");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            // Show interim text while still listening
            if (interim) {
                setTranscript(interim);
            }

            // When we get a final result, fire the callback
            if (final) {
                setTranscript(final);
                onResult?.(final.trim());
            }
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            setTranscript("");

            if (event.error === "not-allowed") {
                onError?.("Microphone access denied. Please allow microphone permission.");
            } else if (event.error === "no-speech") {
                onError?.("No speech detected. Please try again.");
            } else if (event.error !== "aborted") {
                onError?.(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isSupported, lang, onResult, onError]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    return {
        isListening,
        transcript,
        isSupported,
        startListening,
        stopListening,
    };
}

"use client";

import { useState, useCallback } from "react";
import { sendChatMessage, getAudioUrl } from "../services/api";

export interface ChatMessage {
    role: "user" | "assistant";
    text: string;
    audioUrl?: string;
}

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [latestAudioUrl, setLatestAudioUrl] = useState<string | null>(null);

    const sendMessage = useCallback(async (phone: string, question: string) => {
        if (!phone || !question.trim()) return;

        // Add user message immediately
        setMessages((prev) => [...prev, { role: "user", text: question }]);
        setLoading(true);
        setError(null);
        setLatestAudioUrl(null);

        try {
            const res = await sendChatMessage(phone, question);
            const chatData = res.data || res;

            const audioUrl = chatData.audio_file
                ? getAudioUrl(chatData.audio_file)
                : undefined;

            setLatestAudioUrl(audioUrl || null);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: chatData.text_response || "No response received.",
                    audioUrl,
                },
            ]);
        } catch (err: any) {
            const errMsg =
                err?.response?.data?.message || err.message || "Chat request failed";
            setError(errMsg);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: `Error: ${errMsg}` },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setLatestAudioUrl(null);
    }, []);

    return { messages, loading, error, latestAudioUrl, sendMessage, clearMessages };
}

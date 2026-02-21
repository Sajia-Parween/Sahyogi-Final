"use client";

import { useState, useCallback } from "react";
import { simulateCall, getAudioUrl } from "../services/api";

export function useCall() {
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const makeCall = useCallback(async (phone: string) => {
        if (!phone) return;
        setLoading(true);
        setError(null);
        try {
            const res = await simulateCall(phone);
            // The call endpoint returns data directly (no wrapper)
            const callData = res.data || res;

            // Resolve audio URL
            if (callData.audio_file) {
                callData.audio_file = getAudioUrl(callData.audio_file);
            }

            setData(callData);
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err.message ||
                "Call simulation failed"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, makeCall };
}

"use client";

import { useState, useCallback } from "react";
import { getAdvice } from "../services/api";

interface AdviceData {
    farmer: string;
    structured: Record<string, any>;
    narrative: string;
}

export function useAdvice() {
    const [data, setData] = useState<AdviceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAdvice = useCallback(async (phone: string) => {
        if (!phone) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getAdvice(phone);
            if (res.success !== false) {
                setData(res.data || res);
            } else {
                setError(res.message || "Failed to fetch advice");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Failed to fetch advice");
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, fetchAdvice };
}

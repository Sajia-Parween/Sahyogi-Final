"use client";

import { useState, useCallback } from "react";
import { simulateSell } from "../services/api";

export function useSimulation() {
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runSimulation = useCallback(
        async (phone: string, sellAfterDays: number) => {
            if (!phone) return;
            setLoading(true);
            setError(null);
            try {
                const res = await simulateSell(phone, sellAfterDays);
                setData(res.data || res);
            } catch (err: any) {
                setError(
                    err?.response?.data?.detail ||
                    err?.response?.data?.message ||
                    err.message ||
                    "Simulation failed"
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { data, loading, error, runSimulation };
}

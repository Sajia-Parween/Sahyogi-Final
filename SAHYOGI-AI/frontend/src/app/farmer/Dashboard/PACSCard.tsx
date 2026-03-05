"use client";

import { useState, useEffect, useCallback } from "react";
import { useFarmer } from "../../../context/FarmerContext";
import {
    getPacsList,
    getPacsQueue,
    bookPacsSlot,
    getMyPacsBookings,
    cancelPacsBooking,
} from "../../../services/api";

interface PACS {
    id: string;
    name: string;
    address: string;
    district: string;
    services: string[];
    operating_hours: string;
    contact: string;
}

interface QueueStatus {
    current_queue: number;
    estimated_wait_minutes: number;
    available_slots: string[];
    services: string[];
    booked_slots_today: number;
}

interface Booking {
    booking_id: string;
    token_number: number;
    pacs_name: string;
    service: string;
    preferred_time: string;
    date: string;
    status: string;
}

export default function PACSCard() {
    const { phone } = useFarmer();

    // Data state
    const [pacsList, setPacsList] = useState<PACS[]>([]);
    const [selectedPacs, setSelectedPacs] = useState<string>("");
    const [queue, setQueue] = useState<QueueStatus | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);

    // Form state
    const [selectedService, setSelectedService] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showBookings, setShowBookings] = useState(false);
    const [confirmation, setConfirmation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load PACS list on mount
    useEffect(() => {
        async function fetchPacs() {
            try {
                const res = await getPacsList();
                const list = res?.data || res;
                if (Array.isArray(list)) {
                    setPacsList(list);
                    if (list.length > 0) setSelectedPacs(list[0].id);
                }
            } catch {
                /* silent fail */
            }
        }
        fetchPacs();
    }, []);

    // Fetch queue when PACS changes
    const fetchQueue = useCallback(async () => {
        if (!selectedPacs) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getPacsQueue(selectedPacs);
            setQueue(res?.data || res);
        } catch {
            setError("Failed to fetch queue status");
        } finally {
            setLoading(false);
        }
    }, [selectedPacs]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    // Auto-refresh queue every 30s
    useEffect(() => {
        if (!selectedPacs) return;
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, [selectedPacs, fetchQueue]);

    // Load bookings
    const fetchBookings = useCallback(async () => {
        if (!phone) return;
        try {
            const res = await getMyPacsBookings(phone);
            const data = res?.data || res;
            setBookings(Array.isArray(data) ? data : []);
        } catch {
            /* silent */
        }
    }, [phone]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Book slot handler
    const handleBook = async () => {
        if (!selectedPacs || !selectedService || !selectedTime) {
            setError("Please select a service and time slot");
            return;
        }
        setBookingLoading(true);
        setError(null);
        setConfirmation(null);
        try {
            const res = await bookPacsSlot(selectedPacs, phone, selectedService, selectedTime);
            const data = res?.data || res;
            if (data?.success || data?.booking) {
                setConfirmation(
                    data?.message || `Booked! Token #${data?.booking?.token_number}`
                );
                setSelectedService("");
                setSelectedTime("");
                fetchQueue();
                fetchBookings();
            } else {
                setError(data?.message || "Booking failed");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Booking failed. Try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    // Cancel booking
    const handleCancel = async (bookingId: string) => {
        try {
            await cancelPacsBooking(bookingId);
            fetchBookings();
            fetchQueue();
        } catch {
            setError("Cancel failed");
        }
    };

    const currentPacs = pacsList.find((p) => p.id === selectedPacs);
    const activeBookings = bookings.filter((b) => b.status === "confirmed");

    return (
        <div className="group relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-8xl">🏛️</span>
            </div>

            <div className="relative z-10 flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-700">
                            <span className="text-2xl">🏛️</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                                PACS Queue
                            </h2>
                            <p className="text-gray-400 text-xs">Book your slot online</p>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                            Live
                        </span>
                    </div>
                </div>

                {/* PACS Selector */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Select PACS
                    </label>
                    <select
                        value={selectedPacs}
                        onChange={(e) => {
                            setSelectedPacs(e.target.value);
                            setConfirmation(null);
                            setError(null);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    >
                        {pacsList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} — {p.district}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Queue Status */}
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : queue ? (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                            <p className="text-2xl font-black text-orange-600">
                                {queue.current_queue}
                            </p>
                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mt-1">
                                In Queue
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                            <p className="text-2xl font-black text-blue-600">
                                {queue.estimated_wait_minutes}
                                <span className="text-xs font-medium">m</span>
                            </p>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-1">
                                Wait Time
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                            <p className="text-2xl font-black text-green-600">
                                {queue.available_slots?.length || 0}
                            </p>
                            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mt-1">
                                Slots Left
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Operating Hours */}
                {currentPacs && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>🕐</span>
                        <span className="font-medium">
                            Hours: {currentPacs.operating_hours}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>📞 {currentPacs.contact}</span>
                    </div>
                )}

                {/* Booking Form */}
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        📋 Book a Slot
                    </p>

                    {/* Service selector */}
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                        <option value="">Select Service...</option>
                        {(queue?.services || currentPacs?.services || []).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    {/* Time slot selector */}
                    <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                        <option value="">Select Time Slot...</option>
                        {(queue?.available_slots || []).map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>

                    {/* Book button */}
                    <button
                        onClick={handleBook}
                        disabled={bookingLoading || !selectedService || !selectedTime}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${bookingLoading || !selectedService || !selectedTime
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                            }`}
                    >
                        {bookingLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Booking...
                            </>
                        ) : (
                            <>
                                <span>Book Slot</span>
                                <span>→</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Success confirmation */}
                {confirmation && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                        <span className="text-lg">✅</span>
                        {confirmation}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* My Bookings */}
                {activeBookings.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowBookings(!showBookings)}
                            className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider py-2 hover:text-indigo-600 transition-colors"
                        >
                            <span>
                                🎫 My Bookings ({activeBookings.length})
                            </span>
                            <span className={`transition-transform ${showBookings ? "rotate-180" : ""}`}>
                                ▼
                            </span>
                        </button>

                        {showBookings && (
                            <div className="space-y-2 mt-2">
                                {activeBookings.map((b) => (
                                    <div
                                        key={b.booking_id}
                                        className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">
                                                Token #{b.token_number}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {b.service} • {b.preferred_time}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {b.pacs_name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCancel(b.booking_id)}
                                            className="text-xs font-bold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Accent line */}
            <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-indigo-600 transition-all duration-500 group-hover:w-full" />
        </div>
    );
}

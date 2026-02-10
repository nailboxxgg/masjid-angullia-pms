"use client";

import { useEffect, useState } from "react";
import { PrayerData } from "@/lib/prayer-times";
import { fetchPrayerTimes } from "@/app/actions/prayer-times";
import { Loader2, Moon, Sun, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PrayerTimesWidget() {
    const [data, setData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOfflineFallback, setIsOfflineFallback] = useState(false);

    useEffect(() => {
        async function fetchTimes() {
            try {
                const times = await fetchPrayerTimes();
                if (times) {
                    setData(times);
                    localStorage.setItem('prayer-times-cache', JSON.stringify(times));
                    setIsOfflineFallback(false);
                } else {
                    throw new Error("Fetch returned null");
                }
            } catch (err) {
                console.warn("Prayer times fetch failed, attempting cache fallback", err);
                const cached = localStorage.getItem('prayer-times-cache');
                if (cached) {
                    setData(JSON.parse(cached));
                    setIsOfflineFallback(true);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchTimes();
    }, []);

    if (loading) return <div className="h-24 flex items-center justify-center text-white/50"><Loader2 className="animate-spin w-6 h-6" /></div>;
    if (!data) return null;

    const timings = data.timings;
    const hijri = data.date.hijri;

    const prayers = [
        { name: "Fajr", time: timings.Fajr },
        { name: "Dhuhr", time: timings.Dhuhr },
        { name: "Asr", time: timings.Asr },
        { name: "Maghrib", time: timings.Maghrib },
        { name: "Isha", time: timings.Isha },
    ];

    const formatTo12Hour = (time24: string) => {
        if (!time24) return "--:--";

        try {
            const [time, modifier] = time24.split(' ');
            if (modifier && (modifier === 'AM' || modifier === 'PM')) return time24;

            const [hours, minutes] = time.split(':');
            if (!hours || !minutes) return time24;

            let h = parseInt(hours, 10);
            const m = minutes;
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        } catch (e) {
            console.error("Error formatting time:", time24, e);
            return time24;
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white overflow-hidden relative group">
            {isOfflineFallback && (
                <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[10px] font-medium text-white/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    <CloudOff className="w-3 h-3" />
                    Cached Data
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 to-secondary-900/40 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Date Section */}
                <div className="text-center md:text-left min-w-[150px]">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1 text-primary-300 font-medium">
                        <Moon className="w-4 h-4" />
                        <span className="text-sm tracking-widest uppercase">Hijri Date</span>
                    </div>
                    <h3 className="text-3xl font-bold font-heading">{hijri.day} {hijri.month.en}</h3>
                    <p className="text-secondary-200 text-sm mt-1">{hijri.year} AH</p>
                    <div className="mt-2 text-xs text-white/50">{data.date.readable}</div>
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px h-16 bg-white/20" />

                {/* Timings Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-2 w-full max-w-lg">
                    {prayers.map((prayer, idx) => (
                        <div
                            key={prayer.name}
                            className={cn(
                                "flex flex-col items-center p-3 md:p-2 rounded-lg bg-white/5 md:bg-transparent hover:bg-white/10 transition-colors border border-white/10 md:border-transparent",
                                idx === 4 ? "col-span-2 sm:col-span-1" : ""
                            )}
                        >
                            <span className="text-xs text-secondary-300 font-medium uppercase mb-1">{prayer.name}</span>
                            <span className="text-base font-bold whitespace-nowrap">{
                                formatTo12Hour(prayer.time)
                            }</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

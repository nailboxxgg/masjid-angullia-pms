
"use client";

import { useEffect, useState } from "react";
import { getPrayerTimes, PrayerData } from "@/lib/prayer-times";
import { Loader2, Moon, Sun } from "lucide-react";

export default function PrayerTimesWidget() {
    const [data, setData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTimes() {
            const times = await getPrayerTimes();
            setData(times);
            setLoading(false);
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

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white overflow-hidden relative group">
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
                <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
                    {prayers.map((prayer) => (
                        <div key={prayer.name} className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xs text-secondary-300 font-medium uppercase mb-1">{prayer.name}</span>
                            <span className="text-base font-bold whitespace-nowrap">{
                                // Simple text cleaning, APIs sometimes return "05:30 (PST)"
                                prayer.time.split(' ')[0]
                            }</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

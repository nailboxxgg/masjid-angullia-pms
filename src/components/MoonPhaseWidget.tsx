"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff, Loader2, Moon, Sparkles } from "lucide-react";
import { fetchMoonPhase } from "@/app/actions/moon-phase";
import type { MoonPhaseData } from "@/lib/moon-phase";
import { formatMoonDateTime, formatMoonDistance, formatMoonPercent } from "@/lib/moon-phase";
import { cn } from "@/lib/utils";

const CACHE_KEY = "moon-phase-cache";

export default function MoonPhaseWidget() {
    const [data, setData] = useState<MoonPhaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOfflineFallback, setIsOfflineFallback] = useState(false);

    useEffect(() => {
        async function fetchPhase() {
            try {
                const moonPhase = await fetchMoonPhase();
                if (!moonPhase) throw new Error("Fetch returned null");

                setData(moonPhase);
                localStorage.setItem(CACHE_KEY, JSON.stringify(moonPhase));
                setIsOfflineFallback(false);
            } catch (err) {
                console.warn("Moon phase fetch failed, attempting cache fallback", err);
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    setData(JSON.parse(cached));
                    setIsOfflineFallback(true);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchPhase();
    }, []);

    const moonSvgSrc = useMemo(() => {
        if (!data?.moonVisual?.svg) return null;
        return `data:image/svg+xml;utf8,${encodeURIComponent(data.moonVisual.svg)}`;
    }, [data?.moonVisual?.svg]);

    if (loading) {
        return (
            <div className="h-24 flex items-center justify-center text-white/50">
                <Loader2 className="animate-spin w-6 h-6" />
            </div>
        );
    }

    if (!data) return null;

    const specialLabels = data.specialMoon?.labels?.filter(Boolean) || [];
    const nextFullMoon = data.nextPhases?.fullMoon || data.traditionalMoon?.appliesToFullMoonAt;

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 text-white overflow-hidden relative group">
            {isOfflineFallback && (
                <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[10px] font-medium text-white/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    <CloudOff className="w-3 h-3" />
                    Cached Data
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-primary-900/30 to-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
                        {moonSvgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={moonSvgSrc} alt={`${data.phase.name} moon phase`} className="w-16 h-16 object-contain" />
                        ) : (
                            <Moon className="w-10 h-10 text-primary-200" />
                        )}
                    </div>

                    <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2 text-primary-300 font-medium mb-1">
                            <Moon className="w-4 h-4" />
                            <span className="text-sm tracking-widest uppercase">Moon Phase</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold font-heading leading-tight">{data.phase.name}</h3>
                        <p className="text-sm text-white/65 mt-1">
                            {data.phase.isWaxing ? "Waxing" : "Waning"} moon - {data.phase.ageDays.toFixed(1)} days old
                        </p>
                    </div>
                </div>

                <div className="hidden md:block w-px h-16 bg-white/20" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:max-w-xl">
                    <MoonStat label="Illumination" value={formatMoonPercent(data.phase.illumination)} />
                    <MoonStat label="Distance" value={formatMoonDistance(data.phase.distanceKm)} />
                    <MoonStat label="Next Full" value={formatMoonDateTime(nextFullMoon)} />
                    <MoonStat
                        label="Traditional"
                        value={data.traditionalMoon?.name || specialLabels[0] || "Regular Moon"}
                        highlight={specialLabels.length > 0}
                    />
                </div>
            </div>
        </div>
    );
}

function MoonStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center min-h-20 p-3 rounded-lg bg-white/5 md:bg-transparent hover:bg-white/10 transition-colors border border-white/10 md:border-transparent text-center",
                highlight && "bg-primary-500/15 border-primary-300/20"
            )}
        >
            <span className="text-xs text-secondary-300 font-medium uppercase mb-1">{label}</span>
            <span className="text-sm font-bold leading-snug">
                {highlight && <Sparkles className="inline w-3.5 h-3.5 mr-1 text-primary-200" />}
                {value}
            </span>
        </div>
    );
}

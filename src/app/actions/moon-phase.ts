"use server";

import type { MoonPhaseData } from "@/lib/moon-phase";

const FREEASTRO_API_URL = "https://api.freeastroapi.com/api/v1/moon/phase";
const MASJID_LAT = "16.1561";
const MASJID_LON = "119.9811";
const TIMEZONE = "Asia/Manila";

interface FreeAstroMoonResponse {
    timestamp: string;
    phase: {
        name: string;
        phase_angle_deg: number;
        illumination: number;
        age_days: number;
        distance_km: number;
        is_waxing: boolean;
    };
    next_phases?: {
        new_moon?: string;
        first_quarter?: string;
        full_moon?: string;
        last_quarter?: string;
    };
    moon_visual?: {
        type: "svg";
        svg: string;
        shadow_ratio?: number;
        waxing?: boolean;
    };
    forecast?: {
        days_until_full_moon?: number;
        days_until_new_moon?: number;
        next_special_moon?: {
            type: string;
            subtype?: string;
            days_until?: number;
        } | null;
        next_eclipse?: {
            type?: string;
            is_blood_moon?: boolean;
            date?: string;
            days_until?: number;
        } | null;
    };
    special_moon?: {
        is_supermoon?: boolean;
        is_micromoon?: boolean;
        is_blue_moon?: boolean;
        is_black_moon?: boolean;
        is_harvest_moon?: boolean;
        is_hunter_moon?: boolean;
        labels?: string[];
    };
    traditional_moon?: {
        name: string;
        naming_system?: string;
        month?: string;
        applies_to_full_moon_at?: string;
        is_current_full_moon?: boolean;
    };
}

const buildMoonPhaseUrl = () => {
    const requestDate = new Date();
    requestDate.setUTCMinutes(0, 0, 0);

    const params = new URLSearchParams({
        date: requestDate.toISOString().slice(0, 19),
        lat: MASJID_LAT,
        lon: MASJID_LON,
        tz_str: TIMEZONE,
        include_visuals: "true",
        include_forecast: "true",
        include_special: "true",
        include_traditional_moon: "true",
        style_moon_color: "#F8FAFC",
        style_shadow_color: "#111827",
    });

    return `${FREEASTRO_API_URL}?${params.toString()}`;
};

const mapMoonPhaseResponse = (data: FreeAstroMoonResponse): MoonPhaseData => ({
    timestamp: data.timestamp,
    phase: {
        name: data.phase.name,
        phaseAngleDeg: data.phase.phase_angle_deg,
        illumination: data.phase.illumination,
        ageDays: data.phase.age_days,
        distanceKm: data.phase.distance_km,
        isWaxing: data.phase.is_waxing,
    },
    nextPhases: data.next_phases
        ? {
            newMoon: data.next_phases.new_moon,
            firstQuarter: data.next_phases.first_quarter,
            fullMoon: data.next_phases.full_moon,
            lastQuarter: data.next_phases.last_quarter,
        }
        : undefined,
    moonVisual: data.moon_visual
        ? {
            type: data.moon_visual.type,
            svg: data.moon_visual.svg,
            shadowRatio: data.moon_visual.shadow_ratio,
            waxing: data.moon_visual.waxing,
        }
        : undefined,
    forecast: data.forecast
        ? {
            daysUntilFullMoon: data.forecast.days_until_full_moon,
            daysUntilNewMoon: data.forecast.days_until_new_moon,
            nextSpecialMoon: data.forecast.next_special_moon,
            nextEclipse: data.forecast.next_eclipse
                ? {
                    type: data.forecast.next_eclipse.type,
                    isBloodMoon: data.forecast.next_eclipse.is_blood_moon,
                    date: data.forecast.next_eclipse.date,
                    daysUntil: data.forecast.next_eclipse.days_until,
                }
                : null,
        }
        : undefined,
    specialMoon: data.special_moon
        ? {
            isSupermoon: data.special_moon.is_supermoon,
            isMicromoon: data.special_moon.is_micromoon,
            isBlueMoon: data.special_moon.is_blue_moon,
            isBlackMoon: data.special_moon.is_black_moon,
            isHarvestMoon: data.special_moon.is_harvest_moon,
            isHunterMoon: data.special_moon.is_hunter_moon,
            labels: data.special_moon.labels,
        }
        : undefined,
    traditionalMoon: data.traditional_moon
        ? {
            name: data.traditional_moon.name,
            namingSystem: data.traditional_moon.naming_system,
            month: data.traditional_moon.month,
            appliesToFullMoonAt: data.traditional_moon.applies_to_full_moon_at,
            isCurrentFullMoon: data.traditional_moon.is_current_full_moon,
        }
        : undefined,
});

export async function fetchMoonPhase(retries = 1): Promise<MoonPhaseData | null> {
    const apiKey = process.env.FREEASTRO_API_KEY;

    if (!apiKey) {
        console.warn("FREEASTRO_API_KEY is not configured.");
        return null;
    }

    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(buildMoonPhaseUrl(), {
                headers: {
                    "x-api-key": apiKey,
                },
                next: {
                    revalidate: 60 * 60 * 6,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`Failed to fetch moon phase: ${response.status} ${response.statusText}: ${responseText}`);
            }

            const data = (await response.json()) as FreeAstroMoonResponse;
            return mapMoonPhaseResponse(data);
        } catch (error) {
            if (i === retries) {
                console.error("Server Action Error: fetchMoonPhase", error instanceof Error ? error.message : String(error));
                return null;
            }

            await new Promise(resolve => setTimeout(resolve, 750));
        }
    }

    return null;
}

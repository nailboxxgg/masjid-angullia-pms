export interface MoonPhase {
    name: string;
    phaseAngleDeg: number;
    illumination: number;
    ageDays: number;
    distanceKm: number;
    isWaxing: boolean;
}

export interface MoonVisual {
    type: "svg";
    svg: string;
    shadowRatio?: number;
    waxing?: boolean;
}

export interface MoonForecast {
    daysUntilFullMoon?: number;
    daysUntilNewMoon?: number;
    nextSpecialMoon?: {
        type: string;
        subtype?: string;
        daysUntil?: number;
    } | null;
    nextEclipse?: {
        type?: string;
        isBloodMoon?: boolean;
        date?: string;
        daysUntil?: number;
    } | null;
}

export interface MoonSpecial {
    isSupermoon?: boolean;
    isMicromoon?: boolean;
    isBlueMoon?: boolean;
    isBlackMoon?: boolean;
    isHarvestMoon?: boolean;
    isHunterMoon?: boolean;
    labels?: string[];
}

export interface TraditionalMoon {
    name: string;
    namingSystem?: string;
    month?: string;
    appliesToFullMoonAt?: string;
    isCurrentFullMoon?: boolean;
}

export interface MoonPhaseData {
    timestamp: string;
    phase: MoonPhase;
    nextPhases?: {
        newMoon?: string;
        firstQuarter?: string;
        fullMoon?: string;
        lastQuarter?: string;
    };
    moonVisual?: MoonVisual;
    forecast?: MoonForecast;
    specialMoon?: MoonSpecial;
    traditionalMoon?: TraditionalMoon;
}

export const formatMoonPercent = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    return `${Math.round(value * 100)}%`;
};

export const formatMoonDistance = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    return `${Math.round(value).toLocaleString()} km`;
};

export const formatMoonDateTime = (value?: string) => {
    if (!value) return "--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Manila",
    }).format(date);
};

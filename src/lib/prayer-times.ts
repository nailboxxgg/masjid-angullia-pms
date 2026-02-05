
export interface PrayerTimes {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

export interface HijriDate {
    day: string;
    month: {
        en: string;
        ar: string;
    };
    year: string;
}

export interface PrayerData {
    timings: PrayerTimes;
    date: {
        readable: string;
        hijri: HijriDate;
    };
}


// Helper to determine next prayer
export const getNextPrayer = (timings: PrayerTimes): { name: string; time: string; timeLeft: string } | null => {
    // Basic logic to compare current time vs prayer times strings (HH:MM)
    // For production, suggest using moment.js or date-fns for robust comparison
    // This is a placeholder for the logic
    return {
        name: "Maghrib",
        time: timings.Maghrib,
        timeLeft: "2 hours"
    };
};

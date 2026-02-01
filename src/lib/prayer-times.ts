
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

const CITY = "Alaminos";
const COUNTRY = "Philippines";
const METHOD = 2; // ISNA (Islamic Society of North America) - commonly used standard, or 3 (MWL)

export const getPrayerTimes = async (): Promise<PrayerData | null> => {
    try {
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        // Alaminos, Pangasinan coordinates or city lookup
        // Using city/country endpoint for simplicity
        const response = await fetch(
            `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${CITY}&country=${COUNTRY}&method=${METHOD}&school=1`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch prayer times");
        }

        const data = await response.json();
        const timings = data.data.timings;
        const hijri = data.data.date.hijri;

        return {
            timings: {
                Fajr: timings.Fajr,
                Sunrise: timings.Sunrise,
                Dhuhr: timings.Dhuhr,
                Asr: timings.Asr,
                Maghrib: timings.Maghrib,
                Isha: timings.Isha
            },
            date: {
                readable: data.data.date.readable,
                hijri: {
                    day: hijri.day,
                    month: {
                        en: hijri.month.en,
                        ar: hijri.month.ar
                    },
                    year: hijri.year
                }
            }
        };
    } catch (error) {
        console.error("Error getting prayer times:", error);
        return null;
    }
};

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

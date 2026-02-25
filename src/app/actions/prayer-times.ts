"use server";

import { PrayerData } from "@/lib/prayer-times";

const CITY = "Alaminos";
const COUNTRY = "Philippines";
const METHOD = 3; // Muslim World League

export async function fetchPrayerTimes(): Promise<PrayerData | null> {
    try {
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        // Hide external API key/endpoint details from client
        const response = await fetch(
            `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${CITY}&country=${COUNTRY}&method=${METHOD}&school=0`,
            { cache: 'no-store' } // Ensure fresh data on server
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
        console.error("Server Action Error: fetchPrayerTimes", error);
        return null;
    }
}

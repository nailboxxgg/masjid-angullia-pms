"use server";

import { PrayerData } from "@/lib/prayer-times";

const CITY = "Alaminos";
const COUNTRY = "Philippines";
const METHOD = 3; // Muslim World League

export async function fetchPrayerTimes(retries = 2): Promise<PrayerData | null> {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${CITY}&country=${COUNTRY}&method=${METHOD}&school=0`;

    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to fetch prayer times: ${response.status} ${response.statusText}`);
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
            if (i === retries) {
                console.error("Server Action Error: fetchPrayerTimes (All retries failed)", error instanceof Error ? error.message : String(error));
                return null;
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return null;
}

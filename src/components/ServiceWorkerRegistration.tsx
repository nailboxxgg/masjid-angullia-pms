"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            if (process.env.NODE_ENV === "development") {
                navigator.serviceWorker
                    .getRegistrations()
                    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
                    .then(() => console.log("SW unregistered in development"))
                    .catch((err) => console.error("SW unregister failed", err));
                return;
            }

            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => console.log("SW registered", reg))
                .catch((err) => console.error("SW registration failed", err));
        }
    }, []);

    return null;
}

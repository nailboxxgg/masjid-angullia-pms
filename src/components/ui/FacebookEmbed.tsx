"use client";

import { useEffect, useRef, useState } from "react";

interface FacebookEmbedProps {
    url: string;
}

export default function FacebookEmbed({ url }: FacebookEmbedProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" } // Preload when close
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        // Load Facebook SDK if not already loaded
        if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);
        } else {
            // Re-parse XFBML if SDK is already present
            // @ts-ignore
            if (window.FB) {
                // @ts-ignore
                window.FB.XFBML.parse(containerRef.current);
            }
        }
    }, [isVisible, url]);

    // Check if the URL is a Facebook URL
    const isFacebook = url.includes("facebook.com") || url.includes("fb.watch");

    if (!isFacebook) {
        return (
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 text-center">
                <p className="text-sm text-secondary-500">View external content: <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{url}</a></p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full min-h-[150px] flex justify-center bg-secondary-50 dark:bg-secondary-900/40 rounded-xl py-4 transition-colors">
            {isVisible ? (
                <div
                    className="fb-post"
                    data-href={url}
                    data-width="auto"
                    data-show-text="true"
                ></div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-secondary-400">
                    <div className="w-6 h-6 border-2 border-secondary-300 border-t-primary-600 rounded-full animate-spin"></div>
                    <span className="text-xs">Loading content...</span>
                </div>
            )}
        </div>
    );
}

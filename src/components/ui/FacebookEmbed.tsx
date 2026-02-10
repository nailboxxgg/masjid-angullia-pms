"use client";

import { useEffect, useRef } from "react";

interface FacebookEmbedProps {
    url: string;
}

export default function FacebookEmbed({ url }: FacebookEmbedProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
    }, [url]);

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
        <div ref={containerRef} className="w-full flex justify-center bg-secondary-50 dark:bg-secondary-900/40 rounded-xl py-4 transition-colors">
            <div
                className="fb-post"
                data-href={url}
                data-width="auto"
                data-show-text="true"
            ></div>
        </div>
    );
}

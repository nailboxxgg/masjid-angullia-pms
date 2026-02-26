"use client";

import { ExternalLink, Facebook } from "lucide-react";

interface FacebookEmbedProps {
    url: string;
}

/**
 * Renders a clean link preview card for external URLs.
 * 
 * Previously this component attempted to use the Facebook SDK to embed
 * posts directly, but that approach is unreliable:
 * - Blocked on localhost by CORS/CSP
 * - Blocked by ad blockers and privacy extensions
 * - SDK creates empty DOM containers that take up space even when blocked
 * - Inconsistent rendering across browsers
 * 
 * The link preview card is a more reliable and cleaner UX.
 */
export default function FacebookEmbed({ url }: FacebookEmbedProps) {
    const isFacebook = url.includes("facebook.com") || url.includes("fb.watch");

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mx-4 mb-3 rounded-xl border border-secondary-200 dark:border-secondary-700 overflow-hidden hover:border-primary-500/50 hover:shadow-md transition-all group"
        >
            <div className="bg-secondary-50 dark:bg-secondary-800/60 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    {isFacebook ? (
                        <Facebook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <ExternalLink className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {isFacebook ? "View on Facebook" : "View External Content"}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate mt-0.5">
                        {url}
                    </p>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary-400 shrink-0 group-hover:text-primary-500 transition-colors" />
            </div>
        </a>
    );
}

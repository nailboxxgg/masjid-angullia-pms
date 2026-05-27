import { NextResponse } from "next/server";

export async function GET() {
    const manifest = {
        name: "Masjid Angullia Members Portal",
        short_name: "Angullia Members",
        description: "PWA app for Masjid Angullia members: view announcements, volunteer, and manage RSVP passes.",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0d9488",
        background_color: "#ffffff",
        start_url: "/members",
        scope: "/members",
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/maskable-icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icons/maskable-icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };

    return NextResponse.json(manifest, {
        headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=86400, must-revalidate",
        },
    });
}

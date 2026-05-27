import { NextResponse } from "next/server";

export async function GET() {
    const manifest = {
        name: "Angullia Admin Portal",
        short_name: "Angullia Admin",
        description: "Staff and administrative dashboard PWA for Masjid Angullia.",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0f172a",
        background_color: "#f8fafc",
        start_url: "/admin",
        scope: "/admin",
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

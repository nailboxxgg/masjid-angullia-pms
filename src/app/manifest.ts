import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Masjid Angullia Portal',
    short_name: 'Angullia',
    description: 'Comprehensive management system for our community',
    display: "standalone",
    orientation: "portrait",
    theme_color: "#020617",
    background_color: "#f8fafc",
    start_url: "/",
    scope: "/",
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/maskable-icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/icons/maskable-icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ],
  }
}

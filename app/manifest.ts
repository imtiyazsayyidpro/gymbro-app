import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gymbro",
    short_name: "Gymbro",
    description: "Track workouts, progressive overload, and weekly progress with Gymbro.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0e0f",
    theme_color: "#0e0e0f",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/assets/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/assets/pwa-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

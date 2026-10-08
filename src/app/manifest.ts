import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEETLeveling — Arise. Grind. Ascend.",
    short_name: "NEETLeveling",
    description: "A Discipline Mastery System for NEET aspirants.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#060810",
    theme_color: "#060810",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

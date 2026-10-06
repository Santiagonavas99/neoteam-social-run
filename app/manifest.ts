import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeoTeam Social Run · Pass",
    short_name: "NeoTeam Pass",
    description: "Tu pase y QR de check-in para NeoTeam Social Run.",
    start_url: "/pase",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    orientation: "portrait",
    icons: [
      {
        src: "/neoteam-pass-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}

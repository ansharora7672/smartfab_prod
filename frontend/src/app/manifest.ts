import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartFab Lathe",
    short_name: "SmartFab",
    description:
      "CNC milling, turning, laser cutting, welding, and precision manufacturing services in Dubai & UAE.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a1628",
    icons: [
      {
        src: "/SmartFab_FinalLogo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

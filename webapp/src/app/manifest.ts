import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CVF Mini Detective Academy",
    short_name: "CVF Mini Game",
    description: "Mini game giao duc cho tre em voi che do phu huynh va bao cao local.",
    start_url: "/",
    display: "standalone",
    background_color: "#eaf6ff",
    theme_color: "#249dff",
    lang: "vi",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

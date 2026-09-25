import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fila de Confissões",
    short_name: "Confissões",
    description:
      "Fila anônima e em tempo real para sessões de confissão em paróquias.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#6b5344",
    lang: "pt-BR",
    orientation: "portrait-primary",
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
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fila de Confissões",
  description:
    "Fila anônima e em tempo real para sessões de confissão em paróquias.",
  applicationName: "Fila de Confissões",
  appleWebApp: {
    capable: true,
    title: "Confissões",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#4c3158",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  // Fiel/padre: portrait no celular. TV usa o mesmo viewport; o layout escala com vw/vh.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${sourceSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";

import { Providers } from "@/components/providers";
import { APP_NAME, APP_SLOGAN, BRAND_COLORS } from "@/lib/brand";

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
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_SLOGAN,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: BRAND_COLORS.purple,
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

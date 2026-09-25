"use client";

import { ThemeProvider } from "next-themes";

import { AuthHashHandler } from "@/components/auth-hash-handler";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <AuthHashHandler />
      {children}
      <Toaster />
      <RegisterServiceWorker />
    </ThemeProvider>
  );
}

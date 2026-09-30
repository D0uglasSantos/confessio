"use client";

import { Suspense } from "react";
import { ThemeProvider } from "next-themes";

import { AuthHashHandler } from "@/components/auth-hash-handler";
import { NavigationProgress } from "@/components/navigation-progress";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AuthHashHandler />
      {children}
      <Toaster />
      <RegisterServiceWorker />
    </ThemeProvider>
  );
}

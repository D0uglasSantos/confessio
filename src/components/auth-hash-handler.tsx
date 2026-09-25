"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) return;

    const supabase = createClient();
    void supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ error }) => {
        window.history.replaceState(null, "", window.location.pathname);
        if (error) {
          router.replace("/admin/login?error=reset-link");
          return;
        }

        router.replace(
          type === "recovery" ? "/admin/redefinir-senha" : "/admin",
        );
      });
  }, [router]);

  return null;
}

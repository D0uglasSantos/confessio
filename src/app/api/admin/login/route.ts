import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { signInAdminWithPassword } from "@/lib/admin/sign-in";
import type { AdminSignInFailure } from "@/lib/admin/sign-in-messages";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function loginErrorPath(code: AdminSignInFailure) {
  return `/admin/login?error=${code}`;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let url: string;
  let anonKey: string;

  try {
    ({ url, anonKey } = getSupabasePublicEnv());
  } catch {
    return redirectTo(request, loginErrorPath("config"));
  }

  const pendingCookies: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
        });
        Object.assign(pendingHeaders, headers);
      },
    },
  });

  let result: Awaited<ReturnType<typeof signInAdminWithPassword>>;

  try {
    result = await signInAdminWithPassword(supabase, email, password);
  } catch {
    return redirectTo(request, loginErrorPath("unexpected"));
  }

  const response = redirectTo(
    request,
    result.ok ? "/admin" : loginErrorPath(result.code),
  );

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  Object.entries(pendingHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

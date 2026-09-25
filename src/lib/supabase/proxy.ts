import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;
  const hasAuthCode =
    request.nextUrl.searchParams.has("code") &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/confirm");

  if (hasAuthCode) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/callback";
    if (!redirectUrl.searchParams.get("next")) {
      redirectUrl.searchParams.set("next", "/admin/redefinir-senha");
    }
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminAuth =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/esqueci-senha") ||
    pathname.startsWith("/admin/redefinir-senha");

  if (isAdminRoute && !isPublicAdminAuth && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/admin/login") && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

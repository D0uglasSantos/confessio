import { NextResponse, type NextRequest } from "next/server";

import { safeAuthNext } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const next = safeAuthNext(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/admin/login?error=reset-link", origin),
  );
}

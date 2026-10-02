import type { NextRequest, NextResponse } from "next/server";

const COOKIE = "confessio_login_attempts";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptState = {
  count: number;
  resetAt: number;
};

function parseAttempts(raw: string | undefined): AttemptState | null {
  if (!raw) return null;
  const [countRaw, resetRaw] = raw.split(":");
  const count = Number(countRaw);
  const resetAt = Number(resetRaw);
  if (!Number.isFinite(count) || !Number.isFinite(resetAt)) {
    return null;
  }
  if (resetAt <= Date.now()) {
    return null;
  }
  return { count, resetAt };
}

export function isLoginThrottled(request: NextRequest) {
  const state = parseAttempts(request.cookies.get(COOKIE)?.value);
  return Boolean(state && state.count >= MAX_ATTEMPTS);
}

export function applyLoginAttemptCookie(
  response: NextResponse,
  request: NextRequest,
  failed: boolean,
) {
  if (!failed) {
    response.cookies.set(COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return;
  }

  const current = parseAttempts(request.cookies.get(COOKIE)?.value);
  const resetAt = current?.resetAt ?? Date.now() + WINDOW_MS;
  const count = (current?.count ?? 0) + 1;

  response.cookies.set(COOKIE, `${count}:${resetAt}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(resetAt),
  });
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function safeAuthNext(
  value: string | null | undefined,
  fallback = "/admin/redefinir-senha",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function passwordResetCallbackUrl() {
  // Site URL do projeto. Redirects extras precisam estar allowlisted no dashboard.
  return getAppUrl();
}

export function sessionPublicUrl(slug: string) {
  return `${getAppUrl()}/s/${slug}`;
}

export function ticketClaimUrl(slug: string, token: string) {
  return `${getAppUrl()}/s/${slug}/minha-senha?t=${token}`;
}

export function sessionTvUrl(slug: string) {
  return `${getAppUrl()}/tv/${slug}`;
}

export function stationPriestUrl(stationId: string, accessToken: string) {
  return `${getAppUrl()}/padre/${stationId}?token=${accessToken}`;
}

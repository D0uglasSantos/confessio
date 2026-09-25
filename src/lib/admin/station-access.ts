export function stationAccessToken(
  access:
    | { access_token: string }
    | { access_token: string }[]
    | null
    | undefined,
) {
  if (!access) return null;
  return Array.isArray(access) ? (access[0]?.access_token ?? null) : access.access_token;
}
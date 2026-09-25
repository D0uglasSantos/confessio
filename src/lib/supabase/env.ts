function missingEnv(name: string): never {
  throw new Error(`Variável de ambiente ausente: ${name}`);
}

export function getSupabasePublicEnv() {
  // Acesso estático: o bundler do Next só injeta NEXT_PUBLIC_* assim no client.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) missingEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) missingEnv("SUPABASE_SERVICE_ROLE_KEY");

  return key;
}

export function isLocalSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.includes("127.0.0.1") || url.includes("localhost");
}

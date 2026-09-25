function missingEnv(name: string): never {
  throw new Error(`Variável de ambiente ausente: ${name}`);
}

export function getSupabasePublicEnv() {
  // NEXT_PUBLIC_* precisa de acesso estático para o bundler injetar no client.
  // A integração Vercel→Supabase também cria SUPABASE_URL / SUPABASE_ANON_KEY.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!url) missingEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!key) missingEnv("SUPABASE_SERVICE_ROLE_KEY");

  return key;
}

export function isLocalSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  return url.includes("127.0.0.1") || url.includes("localhost");
}

export type AdminSignInFailure =
  | "missing"
  | "credentials"
  | "unconfirmed"
  | "forbidden"
  | "config"
  | "unexpected";

export function adminSignInMessage(code: AdminSignInFailure) {
  switch (code) {
    case "missing":
      return "Informe e-mail e senha.";
    case "unconfirmed":
      return "Confirme o e-mail deste usuário no painel de Auth do Supabase.";
    case "forbidden":
      return "Este usuário não é administrador de paróquia nem da plataforma.";
    case "config":
      return "O login está sem as variáveis do Supabase no servidor. Confira o ambiente na Vercel.";
    case "unexpected":
      return "Não foi possível entrar agora. Tente de novo em instantes.";
    default:
      return "Credenciais inválidas. Use Esqueci a senha se não lembrar.";
  }
}

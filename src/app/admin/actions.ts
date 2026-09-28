"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminChurch } from "@/lib/admin/church";
import { passwordResetCallbackUrl } from "@/lib/app-url";
import { mapQueueError } from "@/lib/queue/errors";
import {
  addStationSchema,
  createSessionSchema,
  issuePaperTicketsSchema,
} from "@/lib/validations/session";

function toIsoDateTime(localValue: string) {
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida");
  }
  return date.toISOString();
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export type CreateSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; message: string };

export async function signInAdmin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const { adminSignInMessage } = await import(
      "@/lib/admin/sign-in-messages"
    );
    const { signInAdminWithPassword } = await import("@/lib/admin/sign-in");
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const result = await signInAdminWithPassword(supabase, email, password);

    if (!result.ok) {
      return { ok: false, message: adminSignInMessage(result.code) };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Não foi possível entrar agora. Tente de novo em instantes.",
    };
  }
}

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { ok: false, message: "Informe o e-mail." };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetCallbackUrl(),
  });

  if (error) {
    return {
      ok: false,
      message:
        "Não foi possível enviar o e-mail. Confira o e-mail e as Redirect URLs no Supabase.",
    };
  }

  return {
    ok: true,
    message:
      "Se o e-mail existir, enviamos um link para definir uma nova senha.",
  };
}

export async function updateAdminPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { ok: false, message: "A senha precisa ter pelo menos 8 caracteres." };
  }

  if (password !== confirm) {
    return { ok: false, message: "As senhas não coincidem." };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Link expirado ou inválido. Peça um novo e-mail de recuperação.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      ok: false,
      message:
        error.message.includes("leaked") || error.code === "weak_password"
          ? "Essa senha é fraca ou já vazou. Escolha outra."
          : "Não foi possível atualizar a senha. Tente de novo.",
    };
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createSessionAction(
  _prev: CreateSessionResult | null,
  formData: FormData,
): Promise<CreateSessionResult> {
  const stationsRaw = String(formData.get("stationsJson") ?? "[]");
  let stations: Array<{ name: string; priestName?: string }> = [];

  try {
    stations = JSON.parse(stationsRaw) as Array<{
      name: string;
      priestName?: string;
    }>;
  } catch {
    return { ok: false, message: "Confessionários inválidos." };
  }

  const parsed = createSessionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    ticketPrefix: formData.get("ticketPrefix") || "C",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    stations,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { admin, church } = await requireAdminChurch();
  const input = parsed.data;

  let startsAt: string;
  let endsAt: string;

  try {
    startsAt = toIsoDateTime(input.startsAt);
    endsAt = toIsoDateTime(input.endsAt);
  } catch {
    return { ok: false, message: "Datas inválidas." };
  }

  const { data: session, error } = await admin
    .from("sessions")
    .insert({
      church_id: church.id,
      name: input.name,
      slug: input.slug.toUpperCase(),
      ticket_prefix: input.ticketPrefix.toUpperCase(),
      starts_at: startsAt,
      ends_at: endsAt,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (error || !session) {
    return {
      ok: false,
      message:
        error?.code === "23505"
          ? "Já existe uma sessão com esse slug."
          : (error?.message ?? "Não foi possível criar a sessão."),
    };
  }

  const { error: stationsError } = await admin.from("stations").insert(
    input.stations.map((station) => ({
      session_id: session.id,
      name: station.name,
      priest_name: station.priestName || null,
      status: "OFFLINE" as const,
    })),
  );

  if (stationsError) {
    await admin.from("sessions").delete().eq("id", session.id);
    return {
      ok: false,
      message: stationsError.message ?? "Erro ao criar confessionários.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/sessoes/${session.id}`);
  return { ok: true, sessionId: session.id };
}

export async function openSessionAction(sessionId: string): Promise<ActionResult> {
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, status, church_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.church_id !== church.id) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  if (session.status !== "DRAFT") {
    return { ok: false, message: "Só é possível abrir sessões em rascunho." };
  }

  const { error } = await admin
    .from("sessions")
    .update({
      status: "OPEN",
      entry_opened_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await admin
    .from("stations")
    .update({ status: "AVAILABLE" })
    .eq("session_id", sessionId)
    .eq("status", "OFFLINE");

  revalidatePath("/admin");
  revalidatePath(`/admin/sessoes/${sessionId}`);
  return { ok: true, message: "Fila aberta." };
}

export async function closeEntryAction(sessionId: string): Promise<ActionResult> {
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, status, church_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.church_id !== church.id) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  if (session.status !== "OPEN") {
    return { ok: false, message: "A entrada só pode ser encerrada com a fila aberta." };
  }

  const { error } = await admin
    .from("sessions")
    .update({
      status: "ENTRY_CLOSED",
      entry_closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/sessoes/${sessionId}`);
  return { ok: true, message: "Entrada encerrada." };
}

export async function finishSessionAction(
  sessionId: string,
  force = false,
): Promise<ActionResult> {
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, status, church_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.church_id !== church.id) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  if (session.status !== "ENTRY_CLOSED" && session.status !== "OPEN") {
    return { ok: false, message: "Sessão não pode ser finalizada neste estado." };
  }

  const { count } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .in("status", ["WAITING", "CALLED", "IN_SERVICE"]);

  if ((count ?? 0) > 0 && !force) {
    return {
      ok: false,
      message: `Ainda há ${count} ticket(s) ativos. Confirme para forçar o encerramento.`,
    };
  }

  const payload = {
    status: "FINISHED" as const,
    finished_at: new Date().toISOString(),
    ...(session.status === "OPEN"
      ? { entry_closed_at: new Date().toISOString() }
      : {}),
  };

  const { error } = await admin
    .from("sessions")
    .update(payload)
    .eq("id", sessionId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await admin
    .from("stations")
    .update({ status: "OFFLINE" })
    .eq("session_id", sessionId);

  revalidatePath("/admin");
  revalidatePath(`/admin/sessoes/${sessionId}`);
  return { ok: true, message: "Sessão encerrada." };
}

export async function addStationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = addStationSchema.safeParse({
    sessionId: formData.get("sessionId"),
    name: formData.get("name"),
    priestName: formData.get("priestName") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { admin, church } = await requireAdminChurch();
  const { sessionId, name, priestName } = parsed.data;

  const { data: session } = await admin
    .from("sessions")
    .select("id, status, church_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.church_id !== church.id) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  if (session.status === "FINISHED" || session.status === "CANCELLED") {
    return { ok: false, message: "Não é possível adicionar confessionários nesta sessão." };
  }

  const { error } = await admin.from("stations").insert({
    session_id: sessionId,
    name,
    priest_name: priestName || null,
    status: session.status === "OPEN" || session.status === "ENTRY_CLOSED"
      ? "AVAILABLE"
      : "OFFLINE",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/sessoes/${sessionId}`);
  return { ok: true, message: "Confessionário adicionado." };
}

export async function toggleWaitingQueueOnTvAction(
  sessionId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, church_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.church_id !== church.id) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  const { error } = await admin
    .from("sessions")
    .update({ show_waiting_queue_on_tv: enabled })
    .eq("id", sessionId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/sessoes/${sessionId}`);
  return { ok: true };
}

export type IssuePaperTicketsResult =
  | { ok: true; batchId: string }
  | { ok: false; message: string };

export async function issuePaperTicketsAction(
  sessionId: string,
  count: number,
): Promise<IssuePaperTicketsResult> {
  const parsed = issuePaperTicketsSchema.safeParse({ sessionId, count });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Escolha um lote de 50 a 500, de 50 em 50.",
    };
  }

  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, status, church_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.church_id !== church.id) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  if (session.status !== "OPEN") {
    return {
      ok: false,
      message: "Abra a fila para imprimir as senhas de papel.",
    };
  }

  const { data, error } = await admin.rpc("admin_issue_paper_tickets", {
    p_session_id: parsed.data.sessionId,
    p_count: parsed.data.count,
  });

  if (error || !data) {
    return {
      ok: false,
      message: mapQueueError(
        error?.message,
        "Não foi possível gerar o lote de senhas.",
      ),
    };
  }

  revalidatePath(`/admin/sessoes/${sessionId}`);
  return { ok: true, batchId: data };
}

"use server";

import { revalidatePath } from "next/cache";

import { passwordResetCallbackUrl } from "@/lib/app-url";
import { requireGlobalAdmin } from "@/lib/admin/global";
import { mapQueueError } from "@/lib/queue/errors";
import {
  assignChurchAdminSchema,
  createChurchSchema,
  setChurchActiveSchema,
  updateChurchSchema,
} from "@/lib/validations/global";

function revalidateGlobalAdmin() {
  revalidatePath("/admin/global", "layout");
}

export type ActionResult =
  { ok: true; message?: string } | { ok: false; message: string };

export type CreateChurchResult =
  { ok: true; churchId: string } | { ok: false; message: string };

export async function createChurchAction(
  _prev: CreateChurchResult | null,
  formData: FormData,
): Promise<CreateChurchResult> {
  const parsed = createChurchSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    logoUrl: formData.get("logoUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { supabase } = await requireGlobalAdmin("operator");
  const { name, slug, logoUrl } = parsed.data;

  const { data, error } = await supabase.rpc("global_create_church", {
    p_name: name,
    p_slug: slug,
    p_logo_url: logoUrl,
  });

  if (error || !data) {
    const message =
      error?.code === "23505"
        ? "Já existe uma paróquia com esse slug."
        : mapQueueError(
            error?.message,
            "Não foi possível cadastrar a paróquia.",
          );
    return { ok: false, message };
  }

  revalidateGlobalAdmin();
  return { ok: true, churchId: data };
}

export async function assignChurchAdminAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = assignChurchAdminSchema.safeParse({
    churchId: formData.get("churchId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { supabase } = await requireGlobalAdmin("operator");

  const { data, error } = await supabase.rpc("global_assign_church_admin", {
    p_church_id: parsed.data.churchId,
    p_user_id: parsed.data.userId,
  });

  if (error || !data) {
    return {
      ok: false,
      message: mapQueueError(
        error?.message,
        "Não foi possível vincular este admin à paróquia.",
      ),
    };
  }

  revalidateGlobalAdmin();
  return { ok: true, message: "Admin vinculado à paróquia." };
}

export async function updateChurchAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateChurchSchema.safeParse({
    churchId: formData.get("churchId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    logoUrl: formData.get("logoUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { supabase } = await requireGlobalAdmin("operator");
  const { churchId, name, slug, logoUrl } = parsed.data;

  const { error } = await supabase.rpc("global_update_church", {
    p_church_id: churchId,
    p_name: name,
    p_slug: slug,
    p_logo_url: logoUrl,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "Já existe uma paróquia com esse slug."
        : mapQueueError(
            error.message,
            "Não foi possível atualizar a paróquia.",
          );
    return { ok: false, message };
  }

  revalidateGlobalAdmin();
  return { ok: true, message: "Paróquia atualizada." };
}

export async function setChurchActiveAction(
  churchId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const parsed = setChurchActiveSchema.safeParse({
    churchId,
    isActive: isActive ? "true" : "false",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { supabase } = await requireGlobalAdmin("operator");

  const { error } = await supabase.rpc("global_set_church_active", {
    p_church_id: parsed.data.churchId,
    p_is_active: isActive,
  });

  if (error) {
    return {
      ok: false,
      message: mapQueueError(
        error.message,
        isActive
          ? "Não foi possível reativar a paróquia."
          : "Não foi possível desativar a paróquia.",
      ),
    };
  }

  revalidateGlobalAdmin();
  return {
    ok: true,
    message: isActive ? "Paróquia reativada." : "Paróquia desativada.",
  };
}

export async function sendChurchAdminResetAction(
  email: string,
): Promise<ActionResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Informe o e-mail." };
  }

  await requireGlobalAdmin("operator");
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: passwordResetCallbackUrl(),
  });

  if (error) {
    return {
      ok: false,
      message: "Não foi possível enviar o e-mail de redefinição.",
    };
  }

  return {
    ok: true,
    message: "Se o e-mail existir, enviamos um link para redefinir a senha.",
  };
}

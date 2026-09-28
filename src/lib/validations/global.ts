import { z } from "zod";

export const createChurchSchema = z.object({
  name: z.string().min(3, "Informe um nome com pelo menos 3 caracteres"),
  slug: z
    .string()
    .min(3)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => value === undefined || z.url().safeParse(value).success,
      "Informe uma URL válida",
    ),
});

export type CreateChurchInput = z.infer<typeof createChurchSchema>;

export const assignChurchAdminSchema = z.object({
  churchId: z.uuid(),
  userId: z.uuid("Informe o ID de usuário (auth.users.id) do admin local"),
});

export type AssignChurchAdminInput = z.infer<typeof assignChurchAdminSchema>;

export const updateChurchSchema = createChurchSchema.extend({
  churchId: z.uuid(),
});

export type UpdateChurchInput = z.infer<typeof updateChurchSchema>;

export const setChurchActiveSchema = z.object({
  churchId: z.uuid(),
  isActive: z.enum(["true", "false"]),
});

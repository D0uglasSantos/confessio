import { brazilLocalInputToIso } from "@/lib/admin/datetime";
import { z } from "zod";

export const ticketPrefixSchema = z
  .string()
  .trim()
  .min(1, "Informe o prefixo da senha")
  .max(4, "Use no máximo 4 caracteres")
  .regex(/^[A-Za-z0-9]+$/, "Use apenas letras e números");

export const createSessionSchema = z
  .object({
    name: z.string().min(3, "Informe um nome com pelo menos 3 caracteres"),
    slug: z
      .string()
      .min(4)
      .max(32)
      .regex(/^[A-Za-z0-9-]+$/, "Use apenas letras, números e hífen"),
    ticketPrefix: ticketPrefixSchema.default("C"),
    startsAt: z.string().min(1, "Informe o horário de início"),
    endsAt: z.string().min(1, "Informe o horário de término"),
    stations: z
      .array(
        z.object({
          name: z.string().min(1),
          priestName: z.string().optional(),
        }),
      )
      .min(1, "Cadastre pelo menos um confessionário"),
  })
  .superRefine((data, ctx) => {
    try {
      const startsAt = brazilLocalInputToIso(data.startsAt);
      const endsAt = brazilLocalInputToIso(data.endsAt);
      if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "O término precisa ser posterior ao início.",
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Data inválida.",
      });
    }
  });

export const rescheduleSessionSchema = z
  .object({
    sessionId: z.uuid(),
    startsAt: z.string().min(1, "Informe o horário de início"),
    endsAt: z.string().min(1, "Informe o horário de término"),
  })
  .superRefine((data, ctx) => {
    try {
      const startsAt = brazilLocalInputToIso(data.startsAt);
      const endsAt = brazilLocalInputToIso(data.endsAt);
      if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "O término precisa ser posterior ao início.",
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Data inválida.",
      });
    }
  });

export const updateStationSchema = z.object({
  stationId: z.uuid(),
  sessionId: z.uuid(),
  name: z.string().min(1, "Informe o nome do confessionário"),
  priestName: z.string().optional(),
});

export const addStationSchema = z.object({
  sessionId: z.uuid(),
  name: z.string().min(1),
  priestName: z.string().optional(),
});

export const PAPER_TICKET_COUNTS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500,
] as const;

export type PaperTicketCount = (typeof PAPER_TICKET_COUNTS)[number];

export const issuePaperTicketsSchema = z.object({
  sessionId: z.uuid(),
  count: z.coerce
    .number()
    .refine(
      (value): value is PaperTicketCount =>
        (PAPER_TICKET_COUNTS as readonly number[]).includes(value),
      "Escolha um lote de 50 a 500, de 50 em 50.",
    ),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

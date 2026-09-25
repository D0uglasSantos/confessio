import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().min(3, "Informe um nome com pelo menos 3 caracteres"),
  slug: z
    .string()
    .min(4)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "Use apenas letras, números e hífen"),
  ticketPrefix: z.string().min(1).max(4).default("C"),
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

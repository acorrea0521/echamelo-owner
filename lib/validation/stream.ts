import { z } from "zod";

export const createStreamSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(120),
});

export type CreateStreamInput = z.infer<typeof createStreamSchema>;

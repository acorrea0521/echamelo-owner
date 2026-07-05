import { z } from "zod";

export const createListingSchema = z.object({
  stream_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(120),
  description: z.string().trim().min(10, "Agrega una descripción de al menos 10 caracteres").max(2000),
  image_urls: z.array(z.string().url()).max(6).default([]),
  starting_price_cents: z.coerce.number().int().positive("El precio debe ser mayor a $0"),
  shipping_cost_cents: z.coerce.number().int().min(0).default(0),
  auction_type: z.enum(["muerte_subita", "continua"]),
  requires_verified_buyers: z.boolean().default(false),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

import { defineCollection, z } from "astro:content";

const docs = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { docs };

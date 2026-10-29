import { z } from "zod";

export const experimentSchema = z.object({
  name: z.string().trim().min(1).max(100).default("Experimento de resiliencia"),
  mode: z.enum(["latency", "http_error"]),
  delayMs: z.number().int().min(0).max(5000).default(1000),
  statusCode: z.number().int().min(400).max(599).default(500),
  iterations: z.number().int().min(1).max(20).default(5),
});

export type ExperimentInput = z.infer<typeof experimentSchema>;

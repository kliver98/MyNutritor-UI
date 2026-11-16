import { z } from 'zod';

export const HealthStatusDtoSchema = z
  .object({
    status: z.string().optional(),
    success: z.boolean().optional(),
    statusCode: z.number().optional(),
    message: z.string().optional(),
    timestamp: z
      .string()
      .optional()
      .default(() => new Date().toISOString()),
    version: z.string().optional(),
    uptime: z.number().optional(),
    uptime_seconds: z.number().optional(),
    uptimeSeconds: z.number().optional(),
    environment: z.string().optional(),
    data: z
      .object({
        app: z.string().optional(),
        environment: z.string().optional(),
        uptimeSeconds: z.number().optional(),
        nodeVersion: z.string().optional(),
        memoryUsageMb: z.number().optional(),
        database: z
          .object({
            provider: z.string().optional(),
            connected: z.boolean().optional(),
            latencyMs: z.number().optional(),
            details: z.string().optional()
          })
          .passthrough()
          .optional()
      })
      .passthrough()
      .optional(),
    details: z.record(z.unknown()).optional()
  })
  .passthrough();

export type HealthStatusDto = z.infer<typeof HealthStatusDtoSchema>;

export const RootSystemInfoDtoSchema = z
  .object({
    name: z.string().optional().default('MyNutritor-Backend'),
    version: z.string().optional().default('1.0.0'),
    description: z.string().optional(),
    status: z.string().optional().default('running'),
    endpoints: z.record(z.unknown()).optional()
  })
  .passthrough();

export type RootSystemInfoDto = z.infer<typeof RootSystemInfoDtoSchema>;

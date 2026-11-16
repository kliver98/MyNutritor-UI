import { z } from 'zod';

export const RoleDtoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().default(''),
    permissions: z.array(z.string()).optional().default([]),
    is_system: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional()
  })
  .passthrough();

export type RoleDto = z.infer<typeof RoleDtoSchema>;

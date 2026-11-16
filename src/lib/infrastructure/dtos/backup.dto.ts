import { z } from 'zod';

export const BackupCollectionDtoSchema = z
  .object({
    name: z.string(),
    count: z.number().default(0),
    size_bytes: z.number().optional(),
    sizeBytes: z.number().optional()
  })
  .passthrough();

export type BackupCollectionDto = z.infer<typeof BackupCollectionDtoSchema>;

export const BackupGenerateResponseDtoSchema = z
  .object({
    token: z.string(),
    download_url: z.string().optional(),
    downloadUrl: z.string().optional(),
    collections_included: z.array(z.string()).optional(),
    collectionsIncluded: z.array(z.string()).optional().default([]),
    expires_at: z.string().optional(),
    expiresAt: z
      .string()
      .optional()
      .default(() => new Date(Date.now() + 3600000).toISOString())
  })
  .passthrough();

export type BackupGenerateResponseDto = z.infer<typeof BackupGenerateResponseDtoSchema>;

export const BackupRestoreResponseDtoSchema = z
  .object({
    success: z.boolean().default(true),
    restored_collections: z.record(z.number()).optional(),
    restoredCollections: z.record(z.number()).optional().default({}),
    message: z.string().optional().default('Restauración completada con éxito')
  })
  .passthrough();

export type BackupRestoreResponseDto = z.infer<typeof BackupRestoreResponseDtoSchema>;

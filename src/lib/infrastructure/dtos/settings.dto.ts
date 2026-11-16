import { z } from 'zod';

export const MobileFeatureFlagsDtoSchema = z
  .object({
    google_sign_in_enabled: z.boolean().default(true),
    work_offline_enabled: z.boolean().default(false)
  })
  .passthrough();

export type MobileFeatureFlagsDto = z.infer<typeof MobileFeatureFlagsDtoSchema>;

export const MobileSettingsDtoSchema = z
  .object({
    id: z.string().optional().default('mobile'),
    appName: z.string().optional().default('MyNutritor'),
    currentVersion: z.string().optional().default('v1.6.25'),
    defaultTheme: z.string().optional().default('LIGHT'),
    schemaVersion: z.number().optional().default(1),
    featureFlags: MobileFeatureFlagsDtoSchema.optional().default({
      google_sign_in_enabled: true,
      work_offline_enabled: false
    })
  })
  .passthrough();

export type MobileSettingsDto = z.infer<typeof MobileSettingsDtoSchema>;

export const FeatureFlagsDtoSchema = MobileFeatureFlagsDtoSchema;

export type FeatureFlagsDto = MobileFeatureFlagsDto;

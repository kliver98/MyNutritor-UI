import { z } from 'zod';

export const MobileSettingsDtoSchema = z
  .object({
    min_app_version: z.string().optional(),
    minAppVersion: z.string().optional().default('1.0.0'),
    force_update: z.boolean().optional(),
    forceUpdate: z.boolean().optional().default(false),
    maintenance_mode: z.boolean().optional(),
    maintenanceMode: z.boolean().optional().default(false),
    support_email: z.string().optional(),
    supportEmail: z.string().optional().default('soporte@mynutritor.com'),
    terms_url: z.string().optional(),
    termsUrl: z.string().optional().default('/terms'),
    privacy_url: z.string().optional(),
    privacyUrl: z.string().optional().default('/privacy')
  })
  .passthrough();

export type MobileSettingsDto = z.infer<typeof MobileSettingsDtoSchema>;

export const FeatureFlagsDtoSchema = z.record(z.boolean());

export type FeatureFlagsDto = z.infer<typeof FeatureFlagsDtoSchema>;

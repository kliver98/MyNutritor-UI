import type { MobileSettings, MobileFeatureFlags } from '../../domain/settings/AppSettings';
import { MobileSettingsDtoSchema, MobileFeatureFlagsDtoSchema } from '../dtos/settings.dto';
import { unwrapData } from './mapper-utils';

export class AppSettingsMapper {
  static toMobileDomain(raw: unknown): MobileSettings {
    const unwrapped = unwrapData(raw);
    const parsed = MobileSettingsDtoSchema.parse(unwrapped);
    return {
      id: parsed.id || 'mobile',
      appName: parsed.appName || 'MyNutritor',
      currentVersion: parsed.currentVersion || 'v1.6.25',
      defaultTheme: parsed.defaultTheme || 'LIGHT',
      schemaVersion: parsed.schemaVersion,
      featureFlags: {
        google_sign_in_enabled: parsed.featureFlags.google_sign_in_enabled ?? true,
        work_offline_enabled: parsed.featureFlags.work_offline_enabled ?? false
      }
    };
  }

  static toFeatureFlagsDomain(raw: unknown): MobileFeatureFlags {
    const unwrapped = unwrapData(raw);
    const parsed = MobileFeatureFlagsDtoSchema.parse(unwrapped);
    return {
      google_sign_in_enabled: parsed.google_sign_in_enabled ?? true,
      work_offline_enabled: parsed.work_offline_enabled ?? false
    };
  }
}

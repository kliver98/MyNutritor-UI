import type { MobileSettings, FeatureFlags } from '../../domain/settings/AppSettings';
import { MobileSettingsDtoSchema, FeatureFlagsDtoSchema } from '../dtos/settings.dto';
import { unwrapData } from './mapper-utils';

export class AppSettingsMapper {
  static toMobileDomain(raw: unknown): MobileSettings {
    const unwrapped = unwrapData(raw);
    const parsed = MobileSettingsDtoSchema.parse(unwrapped);
    return {
      minAppVersion: parsed.minAppVersion || parsed.min_app_version || '1.0.0',
      forceUpdate: parsed.forceUpdate ?? parsed.force_update ?? false,
      maintenanceMode: parsed.maintenanceMode ?? parsed.maintenance_mode ?? false,
      supportEmail: parsed.supportEmail || parsed.support_email || 'soporte@mynutritor.com',
      termsUrl: parsed.termsUrl || parsed.terms_url || '/terms',
      privacyUrl: parsed.privacyUrl || parsed.privacy_url || '/privacy'
    };
  }

  static toFeatureFlagsDomain(raw: unknown): FeatureFlags {
    const unwrapped = unwrapData(raw);
    const parsed = FeatureFlagsDtoSchema.parse(unwrapped);
    return {
      enableAiNutritionist: parsed.enableAiNutritionist ?? true,
      enableBarcodeScanner: parsed.enableBarcodeScanner ?? true,
      enableCommunityRecipes: parsed.enableCommunityRecipes ?? true,
      enableExportPdfReports: parsed.enableExportPdfReports ?? true,
      ...parsed
    };
  }
}

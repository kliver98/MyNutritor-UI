export interface MobileSettings {
  minAppVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  termsUrl: string;
  privacyUrl: string;
}

export interface FeatureFlags {
  enableAiNutritionist: boolean;
  enableBarcodeScanner: boolean;
  enableCommunityRecipes: boolean;
  enableExportPdfReports: boolean;
  [key: string]: boolean;
}

export interface AppSettings {
  mobile: MobileSettings;
  featureFlags: FeatureFlags;
}

export interface IAppSettingsRepository {
  getMobileSettings(): Promise<MobileSettings>;
  updateMobileSettings(settings: Partial<MobileSettings>): Promise<MobileSettings>;
  patchFeatureFlags(flags: Partial<FeatureFlags>): Promise<FeatureFlags>;
}

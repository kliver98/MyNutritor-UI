export interface MobileFeatureFlags {
  google_sign_in_enabled: boolean;
  work_offline_enabled: boolean;
  [key: string]: boolean;
}

export interface MobileSettings {
  id: string;
  appName: string;
  currentVersion: string;
  defaultTheme: string;
  schemaVersion?: number;
  featureFlags: MobileFeatureFlags;
}

export type FeatureFlags = MobileFeatureFlags;

export interface AppSettings {
  mobile: MobileSettings;
  featureFlags: MobileFeatureFlags;
}

export interface IAppSettingsRepository {
  getMobileSettings(): Promise<MobileSettings>;
  updateMobileSettings(settings: Partial<MobileSettings>): Promise<MobileSettings>;
  patchFeatureFlags(flags: Partial<MobileFeatureFlags>): Promise<MobileFeatureFlags>;
}

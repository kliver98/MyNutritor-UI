import type { IHttpClient } from '../../core/http/HttpClient';
import type {
  IAppSettingsRepository,
  MobileSettings,
  FeatureFlags
} from '../../domain/settings/AppSettings';
import { AppSettingsMapper } from '../mappers/AppSettingsMapper';

export class AppSettingsRepository implements IAppSettingsRepository {
  constructor(private http: IHttpClient) {}

  async getMobileSettings(): Promise<MobileSettings> {
    try {
      const res = await this.http.get<unknown>('/api/v1/app-settings/mobile');
      return AppSettingsMapper.toMobileDomain(res.data);
    } catch {
      const res = await this.http.get<unknown>('/api/v1/app_settings/mobile');
      return AppSettingsMapper.toMobileDomain(res.data);
    }
  }

  async updateMobileSettings(settings: Partial<MobileSettings>): Promise<MobileSettings> {
    try {
      const res = await this.http.put<unknown>('/api/v1/app-settings/mobile', settings);
      return AppSettingsMapper.toMobileDomain(res.data);
    } catch {
      const res = await this.http.put<unknown>('/api/v1/app_settings/mobile', settings);
      return AppSettingsMapper.toMobileDomain(res.data);
    }
  }

  async patchFeatureFlags(flags: Partial<FeatureFlags>): Promise<FeatureFlags> {
    try {
      const res = await this.http.patch<unknown>('/api/v1/app-settings/mobile/feature-flags', flags);
      return AppSettingsMapper.toFeatureFlagsDomain(res.data);
    } catch {
      const res = await this.http.patch<unknown>('/api/v1/app_settings/mobile/feature-flags', flags);
      return AppSettingsMapper.toFeatureFlagsDomain(res.data);
    }
  }
}

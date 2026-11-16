import { describe, it, expect } from 'vitest';
import { AppSettingsMapper } from './AppSettingsMapper';

describe('AppSettingsMapper', () => {
  it('debe mapear fielmente la configuración móvil real retornada por el backend y Firestore', () => {
    const rawPayload = {
      success: true,
      statusCode: 200,
      message: 'Configuración mobile obtenida',
      data: {
        id: 'mobile',
        defaultTheme: 'LIGHT',
        appName: 'MyNutritor',
        schemaVersion: 1,
        currentVersion: 'v1.6.25',
        schemaSanitizedAt: 1794871028690,
        featureFlags: {
          work_offline_enabled: false,
          google_sign_in_enabled: true
        }
      }
    };

    const domain = AppSettingsMapper.toMobileDomain(rawPayload);

    expect(domain.id).toBe('mobile');
    expect(domain.appName).toBe('MyNutritor');
    expect(domain.currentVersion).toBe('v1.6.25');
    expect(domain.defaultTheme).toBe('LIGHT');
    expect(domain.schemaVersion).toBe(1);
    expect(domain.featureFlags.google_sign_in_enabled).toBe(true);
    expect(domain.featureFlags.work_offline_enabled).toBe(false);
  });

  it('debe mapear feature flags de forma desacoplada', () => {
    const rawFlags = {
      google_sign_in_enabled: true,
      work_offline_enabled: true
    };

    const flags = AppSettingsMapper.toFeatureFlagsDomain(rawFlags);
    expect(flags.google_sign_in_enabled).toBe(true);
    expect(flags.work_offline_enabled).toBe(true);
  });
});

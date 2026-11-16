import { describe, it, expect, vi } from 'vitest';
import { SystemMapper } from './SystemMapper';
import { SystemRepository } from '../repositories/SystemRepository';
import type { IHttpClient, HttpResponse } from '../../core/http/HttpClient';

describe('SystemMapper', () => {
  it('debe mapear respuesta de salud válida', () => {
    const rawHealth = {
      status: 'healthy',
      timestamp: '2026-11-15T12:00:00Z',
      version: '1.2.0',
      uptime_seconds: 3600
    };

    const health = SystemMapper.toHealthDomain(rawHealth);
    expect(health.status).toBe('healthy');
    expect(health.version).toBe('1.2.0');
    expect(health.uptimeSeconds).toBe(3600);
  });

  it('debe mapear respuesta de salud real de Cloud Run en formato envelope', () => {
    const cloudRunHealth = {
      success: true,
      statusCode: 200,
      message: 'Servicio operativo',
      data: {
        app: 'MyNutritor-Backend',
        environment: 'production',
        uptimeSeconds: 420,
        nodeVersion: 'v20.18.0',
        database: {
          provider: 'Google Cloud Firestore',
          connected: true,
          latencyMs: 125
        }
      }
    };

    const health = SystemMapper.toHealthDomain(cloudRunHealth);
    expect(health.status).toBe('healthy');
    expect(health.version).toBe('MyNutritor-Backend');
    expect(health.uptimeSeconds).toBe(420);
    expect(health.environment).toBe('production');
    expect(health.details).toBeDefined();
  });

  it('debe mapear root info', () => {
    const rawInfo = {
      name: 'MyNutritor Cloud API',
      version: '2.0.0',
      description: 'Backend para gestión nutricional'
    };

    const info = SystemMapper.toRootInfoDomain(rawInfo);
    expect(info.name).toBe('MyNutritor Cloud API');
    expect(info.version).toBe('2.0.0');
  });
});

describe('SystemRepository', () => {
  it('debe consultar /api/v1/health con skipAuth: true', async () => {
    const mockHttp: Partial<IHttpClient> = {
      get: vi.fn().mockResolvedValue({
        data: { status: 'ok', timestamp: '2026-11-15T10:00:00Z' },
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      } as HttpResponse<unknown>)
    };

    const repo = new SystemRepository(mockHttp as IHttpClient);
    const health = await repo.getHealth();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/health', { skipAuth: true });
    expect(health.status).toBe('ok');
  });
});

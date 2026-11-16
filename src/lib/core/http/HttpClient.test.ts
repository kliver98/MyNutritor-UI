import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchHttpClient, AppHttpError } from './HttpClient';
import { InMemoryTokenStorage } from '../storage/TokenStorage';

describe('FetchHttpClient', () => {
  let tokenStorage: InMemoryTokenStorage;
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: FetchHttpClient;

  beforeEach(() => {
    tokenStorage = new InMemoryTokenStorage();
    mockFetch = vi.fn();
    client = new FetchHttpClient(
      'https://api.test.com',
      tokenStorage,
      mockFetch as unknown as typeof fetch
    );
  });

  it('debe inyectar Authorization Bearer token automáticamente si existe en storage', async () => {
    tokenStorage.setToken('test-jwt-token-123');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: 'healthy' })
    });

    await client.get('/api/v1/health');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-jwt-token-123');
  });

  it('no debe inyectar token si skipAuth está activo', async () => {
    tokenStorage.setToken('test-jwt-token-123');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: 'healthy' })
    });

    await client.get('/api/v1/health', { skipAuth: true });

    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  it('debe lanzar AppHttpError estructurado en respuestas 4xx o 5xx', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Token inválido o expirado' })
    });

    await expect(client.get('/api/v1/auth/me')).rejects.toThrow(AppHttpError);

    try {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Token inválido o expirado' })
      });
      await client.get('/api/v1/auth/me');
    } catch (err: unknown) {
      const httpError = err as AppHttpError;
      expect(httpError.status).toBe(401);
      expect(httpError.isUnauthorized).toBe(true);
      expect(httpError.message).toBe('Token inválido o expirado');
    }
  });

  it('debe reintentar solicitudes GET cuando el servidor responde con 5xx', async () => {
    // Primer intento falla 500, segundo intento exitoso 200
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Overload' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'recovered' })
      });

    const res = await client.get<{ status: string }>('/api/v1/health', { retries: 1 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(res.data.status).toBe('recovered');
  });

  it('debe ejecutar callback onUnauthorized al recibir un 401 en llamadas autenticadas', async () => {
    const onUnauthorizedMock = vi.fn();
    client.setOnUnauthorized(onUnauthorizedMock);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Token expirado' })
    });

    await expect(client.get('/api/v1/foods')).rejects.toThrow(AppHttpError);
    expect(onUnauthorizedMock).toHaveBeenCalledTimes(1);
  });
});

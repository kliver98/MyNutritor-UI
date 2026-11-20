import { describe, it, expect, vi } from 'vitest';
import { AuthRepository } from './AuthRepository';
import type { IHttpClient, HttpResponse } from '../../core/http/HttpClient';
import { InMemoryTokenStorage } from '../../core/storage/TokenStorage';

describe('AuthRepository', () => {
  it('debe enviar únicamente username y password al endpoint /api/v1/auth/login sin email ni datos inventados', async () => {
    const mockHttp: Partial<IHttpClient> = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'test_token_123',
            user: {
              id: 'user_1',
              username: 'carlos',
              role: 'user'
            }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      } as HttpResponse<unknown>)
    };

    const storage = new InMemoryTokenStorage();
    const repo = new AuthRepository(mockHttp as IHttpClient, storage);
    const session = await repo.login({
      username: 'carlos',
      password: 'mypassword'
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      {
        username: 'carlos',
        password: 'mypassword'
      },
      { skipAuth: true }
    );

    expect(session.token).toBe('test_token_123');
    expect(session.user.username).toBe('carlos');
    expect(storage.getToken()).toBe('test_token_123');
  });

  it('debe enviar únicamente los valores utilizados en /api/v1/auth/register sin email ni campos inventados', async () => {
    const mockHttp: Partial<IHttpClient> = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            token: 'reg_token_456',
            user: {
              id: 'user_2',
              username: 'nuevo_usuario',
              full_name: 'Marcos Valdés',
              role: 'user'
            }
          }
        },
        status: 201,
        statusText: 'Created',
        headers: new Headers()
      } as HttpResponse<unknown>)
    };

    const storage = new InMemoryTokenStorage();
    const repo = new AuthRepository(mockHttp as IHttpClient, storage);
    const session = await repo.register({
      username: 'nuevo_usuario',
      password: 'secretpassword'
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      {
        username: 'nuevo_usuario',
        password: 'secretpassword',
        age: 25,
        heightCm: 175,
        weightKg: 70,
        genderId: '1',
        activityLevelId: '3',
        goalId: '2',
        roleId: '2'
      },
      { skipAuth: true }
    );

    expect(session.token).toBe('reg_token_456');
    expect(session.user.username).toBe('nuevo_usuario');
  });
});

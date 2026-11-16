import { describe, it, expect, vi } from 'vitest';
import { AuthRepository } from './AuthRepository';
import type { IHttpClient, HttpResponse } from '../../core/http/HttpClient';
import { InMemoryTokenStorage } from '../../core/storage/TokenStorage';

describe('AuthRepository', () => {
  it('debe enviar username, username_or_email, email y password al endpoint /api/v1/auth/login', async () => {
    const mockHttp: Partial<IHttpClient> = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'test_token_123',
            user: {
              id: 'user_1',
              username: 'carlos',
              email: 'carlos@test.com',
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
      usernameOrEmail: 'carlos',
      password: 'mypassword'
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      {
        username: 'carlos',
        username_or_email: 'carlos',
        email: 'carlos',
        password: 'mypassword'
      },
      { skipAuth: true }
    );

    expect(session.token).toBe('test_token_123');
    expect(session.user.username).toBe('carlos');
    expect(storage.getToken()).toBe('test_token_123');
  });
});

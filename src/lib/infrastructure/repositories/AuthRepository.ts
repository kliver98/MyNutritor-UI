import type { IHttpClient } from '../../core/http/HttpClient';
import type { ITokenStorage } from '../../core/storage/TokenStorage';
import type {
  IAuthRepository,
  AuthSession,
  LoginCredentials,
  RegisterData,
  User
} from '../../domain/auth/User';
import { AuthMapper } from '../mappers/AuthMapper';

export class AuthRepository implements IAuthRepository {
  private http: IHttpClient;
  private tokenStorage: ITokenStorage;

  constructor(http: IHttpClient, tokenStorage: ITokenStorage) {
    this.http = http;
    this.tokenStorage = tokenStorage;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const res = await this.http.post<unknown>(
      '/api/v1/auth/login',
      {
        username: credentials.username,
        password: credentials.password
      },
      { skipAuth: true }
    );

    const session = AuthMapper.toSessionDomain(res.data);
    if (session.token) {
      this.tokenStorage.setToken(session.token);
    }

    // Si el login no trajo el usuario completo, lo consultamos en /me
    if (session.user.id === 'current' && session.token) {
      try {
        const me = await this.getMe();
        session.user = me;
      } catch {
        // Mantiene el usuario básico si falla
      }
    }

    this.tokenStorage.setUser(session.user);
    return session;
  }

  async register(data: RegisterData): Promise<AuthSession> {
    const res = await this.http.post<unknown>(
      '/api/v1/auth/register',
      {
        username: data.username,
        password: data.password,
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

    const session = AuthMapper.toRegisterSessionDomain(res.data);
    if (session.token) {
      this.tokenStorage.setToken(session.token);
      this.tokenStorage.setUser(session.user);
    }
    return session;
  }

  async getMe(): Promise<User> {
    const res = await this.http.get<unknown>('/api/v1/auth/me');
    const user = AuthMapper.toUserDomain(res.data);
    this.tokenStorage.setUser(user);
    return user;
  }

  async logout(): Promise<void> {
    this.tokenStorage.clear();
  }
}

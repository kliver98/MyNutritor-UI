import type { User, AuthSession, UserRole } from '../../domain/auth/User';
import { UserDtoSchema, LoginResponseDtoSchema, RegisterResponseDtoSchema } from '../dtos/auth.dto';
import { unwrapData } from './mapper-utils';

export class AuthMapper {
  static toUserDomain(raw: unknown): User {
    const unwrapped = unwrapData(raw);
    const parsed = UserDtoSchema.parse(unwrapped);

    // Normalizar rol: '1' -> 'admin', 'admin' -> 'admin', '2' o cualquier otro -> 'user'
    const rawRole = String(parsed.role ?? parsed.roleId ?? 'user').toLowerCase();
    const normalizedRole: UserRole = rawRole === 'admin' || rawRole === '1' ? 'admin' : 'user';

    const id = parsed.id || parsed.userId || parsed.username || 'user';

    return {
      id,
      username: parsed.username,
      email: parsed.email || '',
      fullName: parsed.fullName || parsed.full_name || undefined,
      role: normalizedRole,
      isActive: parsed.isActive ?? parsed.is_active ?? true,
      createdAt: parsed.createdAt || parsed.created_at || new Date().toISOString(),
      updatedAt: parsed.updatedAt || parsed.updated_at || undefined
    };
  }

  static toSessionDomain(raw: unknown): AuthSession {
    const unwrapped = unwrapData(raw);
    const parsed = LoginResponseDtoSchema.parse(unwrapped);
    const token = parsed.accessToken || parsed.access_token || parsed.token || '';
    const tokenType = parsed.tokenType || parsed.token_type || 'Bearer';

    let user: User;
    if (parsed.user) {
      user = AuthMapper.toUserDomain(parsed.user);
    } else {
      // Fallback si la respuesta solo entrega token (se consulta luego /me)
      user = {
        id: 'current',
        username: 'usuario',
        email: '',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };
    }

    return {
      token,
      tokenType,
      user
    };
  }

  static toRegisterSessionDomain(raw: unknown): AuthSession {
    const unwrapped = unwrapData(raw);
    const parsed = RegisterResponseDtoSchema.parse(unwrapped);
    const token = parsed.accessToken || parsed.access_token || parsed.token || '';
    const tokenType = parsed.token_type || 'Bearer';

    const user: User = parsed.user
      ? AuthMapper.toUserDomain(parsed.user)
      : {
          id: 'new',
          username: 'usuario',
          email: '',
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString()
        };

    return {
      token,
      tokenType,
      user
    };
  }
}

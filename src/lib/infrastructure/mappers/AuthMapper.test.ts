import { describe, it, expect } from 'vitest';
import { AuthMapper } from './AuthMapper';

describe('AuthMapper', () => {
  it('debe mapear correctamente un DTO de usuario con snake_case a la entidad de dominio camelCase', () => {
    const rawDto = {
      id: 'usr_123',
      username: 'carlos_fit',
      email: 'carlos@fit.com',
      full_name: 'Carlos Mendoza',
      role: 'ADMIN',
      is_active: true,
      created_at: '2026-01-10T12:00:00Z'
    };

    const user = AuthMapper.toUserDomain(rawDto);

    expect(user.id).toBe('usr_123');
    expect(user.username).toBe('carlos_fit');
    expect(user.fullName).toBe('Carlos Mendoza');
    expect(user.role).toBe('admin');
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBe('2026-01-10T12:00:00Z');
  });

  it('debe normalizar roles no reconocidos o minúsculas a user o admin', () => {
    const rawUser = {
      id: 456,
      username: 'ana',
      email: 'ana@nutri.com',
      role: 'user'
    };

    const domain = AuthMapper.toUserDomain(rawUser);
    expect(domain.id).toBe('456');
    expect(domain.role).toBe('user');
  });

  it('debe extraer sesión completa con token y usuario mapeado', () => {
    const rawLoginResponse = {
      access_token: 'jwt_mock_token_abc',
      token_type: 'Bearer',
      user: {
        id: 'usr_999',
        username: 'marcos',
        email: 'marcos@test.com',
        role: 'user'
      }
    };

    const session = AuthMapper.toSessionDomain(rawLoginResponse);
    expect(session.token).toBe('jwt_mock_token_abc');
    expect(session.tokenType).toBe('Bearer');
    expect(session.user.id).toBe('usr_999');
    expect(session.user.username).toBe('marcos');
  });

  it('debe mapear exitosamente la respuesta real de Cloud Run de login sin email y con roleId "2"', () => {
    const cloudRunLoginResponse = {
      token: 'jwt_cloud_run_token_testu',
      user: {
        id: 'testU',
        userId: '215975eb-6de8-417b-96b1-c255db30980e',
        username: 'testU',
        age: 25,
        heightCm: 170,
        weightKg: 70,
        genderId: '2',
        activityLevelId: '2',
        goalId: '1',
        roleId: '2',
        role: '2',
        lastUpdated: 1794756350757
      }
    };

    const session = AuthMapper.toSessionDomain(cloudRunLoginResponse);
    expect(session.token).toBe('jwt_cloud_run_token_testu');
    expect(session.user.id).toBe('testU');
    expect(session.user.username).toBe('testU');
    expect(session.user.email).toBe('');
    expect(session.user.role).toBe('user');
    expect(session.user.roleId).toBe('2');
    expect(session.user.isActive).toBe(true);
  });

  it('debe mapear correctamente usuarios con roleId "1" o 1 como Administrador aunque role no esté presente', () => {
    // Caso 1: roleId como string '1' sin campo role
    const adminWithRoleIdStr = {
      id: 'admin_1',
      username: 'kliver_admin',
      roleId: '1'
    };
    const userDomain1 = AuthMapper.toUserDomain(adminWithRoleIdStr);
    expect(userDomain1.role).toBe('admin');
    expect(userDomain1.roleId).toBe('1');

    // Caso 2: roleId como number 1
    const adminWithRoleIdNum = {
      id: 'admin_2',
      username: 'boss',
      roleId: 1
    };
    const userDomain2 = AuthMapper.toUserDomain(adminWithRoleIdNum);
    expect(userDomain2.role).toBe('admin');
    expect(userDomain2.roleId).toBe('1');

    // Caso 3: roleId como string '1' y role como '1'
    const adminFull = {
      id: 'admin_3',
      username: 'superadmin',
      roleId: '1',
      role: '1'
    };
    const userDomain3 = AuthMapper.toUserDomain(adminFull);
    expect(userDomain3.role).toBe('admin');
    expect(userDomain3.roleId).toBe('1');
  });
});

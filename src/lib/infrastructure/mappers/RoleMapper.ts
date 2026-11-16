import type { Role } from '../../domain/roles/Role';
import { RoleDtoSchema } from '../dtos/roles.dto';
import { unwrapData, unwrapList } from './mapper-utils';

export class RoleMapper {
  static toDomain(raw: unknown): Role {
    const unwrapped = unwrapData(raw);
    const parsed = RoleDtoSchema.parse(unwrapped);
    return {
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      permissions: parsed.permissions,
      isSystem: parsed.isSystem ?? parsed.is_system,
      createdAt: parsed.createdAt || parsed.created_at
    };
  }

  static toDomainList(raw: unknown): Role[] {
    const list = unwrapList(raw);
    return list.map((item) => RoleMapper.toDomain(item));
  }
}

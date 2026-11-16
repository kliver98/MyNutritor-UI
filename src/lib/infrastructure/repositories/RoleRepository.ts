import type { IHttpClient } from '../../core/http/HttpClient';
import type { IRoleRepository, Role } from '../../domain/roles/Role';
import { RoleMapper } from '../mappers/RoleMapper';

export class RoleRepository implements IRoleRepository {
  constructor(private http: IHttpClient) {}

  async getAll(): Promise<Role[]> {
    const res = await this.http.get<unknown[]>('/api/v1/roles');
    return RoleMapper.toDomainList(res.data);
  }

  async getById(roleId: string): Promise<Role> {
    const res = await this.http.get<unknown>(`/api/v1/roles/${encodeURIComponent(roleId)}`);
    return RoleMapper.toDomain(res.data);
  }

  async create(roleId: string, role: Omit<Role, 'id'>): Promise<Role> {
    const res = await this.http.post<unknown>(`/api/v1/roles/${encodeURIComponent(roleId)}`, role);
    return RoleMapper.toDomain(res.data);
  }

  async update(roleId: string, updates: Partial<Role>): Promise<Role> {
    const res = await this.http.put<unknown>(
      `/api/v1/roles/${encodeURIComponent(roleId)}`,
      updates
    );
    return RoleMapper.toDomain(res.data);
  }

  async delete(roleId: string): Promise<boolean> {
    await this.http.delete(`/api/v1/roles/${encodeURIComponent(roleId)}`);
    return true;
  }
}

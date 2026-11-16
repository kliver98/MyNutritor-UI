export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt?: string;
}

export interface IRoleRepository {
  getAll(): Promise<Role[]>;
  getById(roleId: string): Promise<Role>;
  create(roleId: string, role: Omit<Role, 'id'>): Promise<Role>;
  update(roleId: string, updates: Partial<Role>): Promise<Role>;
  delete(roleId: string): Promise<boolean>;
}

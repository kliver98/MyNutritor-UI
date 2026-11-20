export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  userId?: string;
  username: string;
  fullName?: string;
  role: UserRole;
  roleId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  token: string;
  tokenType: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(data: RegisterData): Promise<AuthSession>;
  getMe(): Promise<User>;
  logout(): Promise<void>;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
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
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(data: RegisterData): Promise<AuthSession>;
  getMe(): Promise<User>;
  logout(): Promise<void>;
}

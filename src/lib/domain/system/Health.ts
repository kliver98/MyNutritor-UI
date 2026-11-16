export interface HealthStatus {
  status: 'ok' | 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version?: string;
  uptimeSeconds?: number;
  environment?: string;
  details?: Record<string, unknown>;
}

export interface RootSystemInfo {
  name: string;
  version: string;
  description?: string;
  status: string;
}

export interface ISystemRepository {
  getRootInfo(): Promise<RootSystemInfo>;
  getHealth(): Promise<HealthStatus>;
}

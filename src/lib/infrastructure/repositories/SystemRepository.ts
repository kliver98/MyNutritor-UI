import type { IHttpClient } from '../../core/http/HttpClient';
import type { ISystemRepository, HealthStatus, RootSystemInfo } from '../../domain/system/Health';
import { SystemMapper } from '../mappers/SystemMapper';

export class SystemRepository implements ISystemRepository {
  private http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async getRootInfo(): Promise<RootSystemInfo> {
    const res = await this.http.get<unknown>('/', { skipAuth: true });
    return SystemMapper.toRootInfoDomain(res.data);
  }

  async getHealth(): Promise<HealthStatus> {
    const res = await this.http.get<unknown>('/api/v1/health', { skipAuth: true });
    return SystemMapper.toHealthDomain(res.data);
  }
}

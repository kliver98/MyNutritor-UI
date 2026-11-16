import type { HealthStatus, RootSystemInfo } from '../../domain/system/Health';
import { HealthStatusDtoSchema, RootSystemInfoDtoSchema } from '../dtos/system.dto';

export class SystemMapper {
  static toHealthDomain(raw: unknown): HealthStatus {
    const parsed = HealthStatusDtoSchema.parse(raw);

    // Determine status from direct status or from backend success envelope
    let status: HealthStatus['status'] = 'ok';
    if (parsed.status) {
      const s = parsed.status.toLowerCase();
      if (s === 'ok' || s === 'healthy') {
        status = s as HealthStatus['status'];
      } else if (s === 'degraded') {
        status = 'degraded';
      } else if (s === 'down') {
        status = 'down';
      }
    } else if (parsed.success === true || parsed.statusCode === 200) {
      const dbConnected = parsed.data?.database?.connected;
      status = dbConnected === false ? 'degraded' : 'healthy';
    } else if (parsed.success === false) {
      status = 'down';
    }

    const version =
      parsed.version ||
      parsed.data?.app ||
      (parsed.data?.nodeVersion ? `Node ${parsed.data.nodeVersion}` : undefined);

    const uptimeSeconds =
      parsed.uptimeSeconds ?? parsed.uptime_seconds ?? parsed.uptime ?? parsed.data?.uptimeSeconds;

    const environment = parsed.environment || parsed.data?.environment;

    const details =
      parsed.details || (parsed.data?.database ? { database: parsed.data.database } : undefined);

    return {
      status,
      timestamp: parsed.timestamp || new Date().toISOString(),
      version,
      uptimeSeconds,
      environment,
      details
    };
  }

  static toRootInfoDomain(raw: unknown): RootSystemInfo {
    const parsed = RootSystemInfoDtoSchema.parse(raw);
    return {
      name: parsed.name,
      version: parsed.version,
      description: parsed.description,
      status: parsed.status
    };
  }
}

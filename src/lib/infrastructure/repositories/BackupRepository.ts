import { ENV } from '../../core/config/env';
import type { IHttpClient } from '../../core/http/HttpClient';
import type {
  IBackupRepository,
  BackupCollectionInfo,
  BackupGenerateResult,
  BackupRestoreResult,
  RestoreMode
} from '../../domain/backup/Backup';
import { BackupMapper } from '../mappers/BackupMapper';

export class BackupRepository implements IBackupRepository {
  constructor(private http: IHttpClient) {}

  async getCollections(userFilter?: string): Promise<BackupCollectionInfo[]> {
    const params = userFilter ? { user: userFilter } : undefined;
    const res = await this.http.get<unknown>('/api/v1/backup/collections', { params });
    return BackupMapper.toCollectionInfoList(res.data);
  }

  async generateBackup(collections?: string[], userFilter?: string): Promise<BackupGenerateResult> {
    const res = await this.http.post<unknown>('/api/v1/backup/generate', {
      collections,
      user: userFilter
    });
    return BackupMapper.toGenerateResultDomain(res.data);
  }

  getDownloadUrl(token: string): string {
    return `${ENV.API_BASE_URL}/api/v1/backup/download/${encodeURIComponent(token)}`;
  }

  async restoreBackup(backupData: unknown, mode: RestoreMode): Promise<BackupRestoreResult> {
    const res = await this.http.post<unknown>('/api/v1/backup/restore', {
      mode,
      data: backupData
    });
    return BackupMapper.toRestoreResultDomain(res.data);
  }
}

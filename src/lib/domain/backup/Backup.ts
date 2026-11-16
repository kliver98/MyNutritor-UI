export type RestoreMode = 'REPLACE_ALL' | 'ADD_NEW_ONLY';

export interface BackupCollectionInfo {
  name: string;
  count: number;
  sizeBytes?: number;
}

export interface BackupGenerateResult {
  token: string;
  downloadUrl?: string;
  collectionsIncluded: string[];
  expiresAt: string;
}

export interface BackupRestoreResult {
  success: boolean;
  restoredCollections: Record<string, number>;
  message: string;
}

export interface IBackupRepository {
  getCollections(userFilter?: string): Promise<BackupCollectionInfo[]>;
  generateBackup(collections?: string[], userFilter?: string): Promise<BackupGenerateResult>;
  getDownloadUrl(token: string): string;
  restoreBackup(backupData: unknown, mode: RestoreMode): Promise<BackupRestoreResult>;
}

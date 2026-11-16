import type {
  BackupCollectionInfo,
  BackupGenerateResult,
  BackupRestoreResult
} from '../../domain/backup/Backup';
import {
  BackupCollectionDtoSchema,
  BackupGenerateResponseDtoSchema,
  BackupRestoreResponseDtoSchema
} from '../dtos/backup.dto';
import { unwrapData, unwrapList } from './mapper-utils';

export class BackupMapper {
  static toCollectionInfoDomain(raw: unknown): BackupCollectionInfo {
    const unwrapped = unwrapData(raw);
    const parsed = BackupCollectionDtoSchema.parse(unwrapped);
    return {
      name: parsed.name,
      count: parsed.count,
      sizeBytes: parsed.sizeBytes ?? parsed.size_bytes
    };
  }

  static toCollectionInfoList(raw: unknown): BackupCollectionInfo[] {
    const list = unwrapList(raw);
    return list.map((item) => BackupMapper.toCollectionInfoDomain(item));
  }

  static toGenerateResultDomain(raw: unknown): BackupGenerateResult {
    const unwrapped = unwrapData(raw);
    const parsed = BackupGenerateResponseDtoSchema.parse(unwrapped);
    return {
      token: parsed.token,
      downloadUrl: parsed.downloadUrl || parsed.download_url,
      collectionsIncluded: parsed.collectionsIncluded || parsed.collections_included || [],
      expiresAt:
        parsed.expiresAt || parsed.expires_at || new Date(Date.now() + 3600000).toISOString()
    };
  }

  static toRestoreResultDomain(raw: unknown): BackupRestoreResult {
    const unwrapped = unwrapData(raw);
    const parsed = BackupRestoreResponseDtoSchema.parse(unwrapped);
    return {
      success: parsed.success,
      restoredCollections: parsed.restoredCollections || parsed.restored_collections || {},
      message: parsed.message
    };
  }
}

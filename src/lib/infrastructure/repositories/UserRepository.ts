import type { IHttpClient } from '../../core/http/HttpClient';
import type { User } from '../../domain/auth/User';
import type {
  IUserRepository,
  IDailyMacrosRepository,
  IReportsRepository,
  IUserSettingsRepository,
  IDraftsRepository,
  DailyMacro,
  UserReport,
  UserSettings,
  FoodExclusion,
  MealDraft,
  DraftPrompt
} from '../../domain/users/UserManagement';
import { AuthMapper } from '../mappers/AuthMapper';
import { unwrapList } from '../mappers/mapper-utils';
import {
  DailyMacrosMapper,
  ReportsMapper,
  UserSettingsMapper,
  DraftsMapper
} from '../mappers/DailyMacrosMapper';

export class UserRepository implements IUserRepository {
  constructor(private http: IHttpClient) {}

  async getAll(): Promise<User[]> {
    const res = await this.http.get<unknown>('/api/v1/users');
    const list = unwrapList(res.data);
    return list.map((item) => AuthMapper.toUserDomain(item));
  }

  async getById(usernameOrId: string): Promise<User> {
    const res = await this.http.get<unknown>(`/api/v1/users/${encodeURIComponent(usernameOrId)}`);
    return AuthMapper.toUserDomain(res.data);
  }

  async create(user: Partial<User> & { password?: string }): Promise<User> {
    const res = await this.http.post<unknown>('/api/v1/users', user);
    return AuthMapper.toUserDomain(res.data);
  }

  async update(usernameOrId: string, updates: Partial<User>): Promise<User> {
    const res = await this.http.put<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}`,
      updates
    );
    return AuthMapper.toUserDomain(res.data);
  }

  async delete(usernameOrId: string): Promise<boolean> {
    await this.http.delete(`/api/v1/users/${encodeURIComponent(usernameOrId)}`);
    return true;
  }
}

export class DailyMacrosRepository implements IDailyMacrosRepository {
  constructor(private http: IHttpClient) {}

  async getAll(usernameOrId: string): Promise<DailyMacro[]> {
    const res = await this.http.get<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/daily-macros`
    );
    return DailyMacrosMapper.toDomainList(res.data);
  }

  async getByDate(usernameOrId: string, dateStr: string): Promise<DailyMacro | null> {
    try {
      const res = await this.http.get<unknown>(
        `/api/v1/users/${encodeURIComponent(usernameOrId)}/daily-macros/${encodeURIComponent(dateStr)}`
      );
      return DailyMacrosMapper.toDomain(res.data);
    } catch (err: unknown) {
      if ((err as { status?: number })?.status === 404) return null;
      throw err;
    }
  }

  async create(
    usernameOrId: string,
    dateStr: string,
    data: Partial<DailyMacro>
  ): Promise<DailyMacro> {
    const payload = DailyMacrosMapper.toPersistenceDto(data, dateStr);
    const res = await this.http.post<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/daily-macros/${encodeURIComponent(dateStr)}`,
      payload
    );
    return DailyMacrosMapper.toDomain(res.data);
  }

  async update(
    usernameOrId: string,
    dateStr: string,
    data: Partial<DailyMacro>
  ): Promise<DailyMacro> {
    const payload = DailyMacrosMapper.toPersistenceDto(data, dateStr);
    const res = await this.http.put<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/daily-macros/${encodeURIComponent(dateStr)}`,
      payload
    );
    return DailyMacrosMapper.toDomain(res.data);
  }

  async delete(usernameOrId: string, dateStr: string): Promise<boolean> {
    await this.http.delete(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/daily-macros/${encodeURIComponent(dateStr)}`
    );
    return true;
  }
}

export class ReportsRepository implements IReportsRepository {
  constructor(private http: IHttpClient) {}

  async getAll(usernameOrId: string): Promise<UserReport[]> {
    const res = await this.http.get<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/reports`
    );
    return ReportsMapper.toDomainList(res.data);
  }

  async getById(usernameOrId: string, reportId: string): Promise<UserReport> {
    const res = await this.http.get<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/reports/${encodeURIComponent(reportId)}`
    );
    return ReportsMapper.toDomain(res.data);
  }

  async create(usernameOrId: string, data: Partial<UserReport>): Promise<UserReport> {
    const payload = ReportsMapper.toPersistenceDto(data, usernameOrId);
    const res = await this.http.post<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/reports`,
      payload
    );
    return ReportsMapper.toDomain(res.data);
  }

  async delete(usernameOrId: string, reportId: string): Promise<boolean> {
    await this.http.delete(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/reports/${encodeURIComponent(reportId)}`
    );
    return true;
  }
}

export class UserSettingsRepository implements IUserSettingsRepository {
  constructor(private http: IHttpClient) {}

  async getSettings(usernameOrId: string): Promise<UserSettings> {
    try {
      const res = await this.http.get<unknown>(
        `/api/v1/users/${encodeURIComponent(usernameOrId)}/settings`
      );
      return UserSettingsMapper.toSettingsDomain(res.data);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        try {
          const res2 = await this.http.get<unknown>(
            `/api/v1/users/${encodeURIComponent(usernameOrId)}/user_settings`
          );
          return UserSettingsMapper.toSettingsDomain(res2.data);
        } catch {
          const res3 = await this.http.get<unknown>(
            `/api/v1/users/${encodeURIComponent(usernameOrId)}/user-settings`
          );
          return UserSettingsMapper.toSettingsDomain(res3.data);
        }
      }
      throw err;
    }
  }

  async updateSettings(
    usernameOrId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const payload = UserSettingsMapper.toPersistenceDto(settings);
    const res = await this.http.put<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/settings`,
      payload
    );
    return UserSettingsMapper.toSettingsDomain(res.data);
  }

  async getFoodExclusions(usernameOrId: string): Promise<FoodExclusion> {
    const res = await this.http.get<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/food-exclusions`
    );
    return UserSettingsMapper.toExclusionsDomain(res.data);
  }

  async updateFoodExclusions(
    usernameOrId: string,
    exclusions: Partial<FoodExclusion>
  ): Promise<FoodExclusion> {
    const payload = {
      excludedIds: exclusions.excludedFoodIds || []
    };
    const res = await this.http.put<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/food-exclusions`,
      payload
    );
    return UserSettingsMapper.toExclusionsDomain(res.data);
  }
}

export class DraftsRepository implements IDraftsRepository {
  constructor(private http: IHttpClient) {}

  async getMealDrafts(usernameOrId: string): Promise<MealDraft[]> {
    const res = await this.http.get<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/meal-drafts`
    );
    return DraftsMapper.toMealDraftDomainList(res.data);
  }

  async createMealDraft(
    usernameOrId: string,
    draft: Omit<MealDraft, 'id' | 'createdAt'> | Partial<MealDraft>
  ): Promise<MealDraft> {
    const payload = DraftsMapper.toPersistenceDto({
      title: draft.title || 'Borrador de comida',
      userId: draft.userId || '',
      mealType: draft.mealType || 'lunch',
      ingredients: draft.ingredients || []
    });
    const res = await this.http.post<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/meal-drafts`,
      payload
    );
    return DraftsMapper.toMealDraftDomain(res.data);
  }

  async deleteMealDraft(usernameOrId: string, draftId: string): Promise<boolean> {
    await this.http.delete(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/meal-drafts/${encodeURIComponent(draftId)}`
    );
    return true;
  }

  async getDraftPrompts(usernameOrId: string): Promise<DraftPrompt[]> {
    const res = await this.http.get<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/draft-prompts`
    );
    return DraftsMapper.toDraftPromptDomainList(res.data);
  }

  async createDraftPrompt(usernameOrId: string, promptText: string): Promise<DraftPrompt> {
    const res = await this.http.post<unknown>(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/draft-prompts`,
      { prompt_text: promptText }
    );
    return DraftsMapper.toDraftPromptDomain(res.data);
  }

  async deleteDraftPrompt(usernameOrId: string, promptId: string): Promise<boolean> {
    await this.http.delete(
      `/api/v1/users/${encodeURIComponent(usernameOrId)}/draft-prompts/${encodeURIComponent(promptId)}`
    );
    return true;
  }
}

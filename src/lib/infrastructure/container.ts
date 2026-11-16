import { defaultHttpClient, type IHttpClient } from '../core/http/HttpClient';
import { defaultTokenStorage, type ITokenStorage } from '../core/storage/TokenStorage';

import { SystemRepository } from './repositories/SystemRepository';
import { AuthRepository } from './repositories/AuthRepository';
import {
  UserRepository,
  DailyMacrosRepository,
  ReportsRepository,
  UserSettingsRepository,
  DraftsRepository
} from './repositories/UserRepository';
import { RecipeRepository } from './repositories/RecipeRepository';
import { FoodItemRepository } from './repositories/FoodItemRepository';
import { AppSettingsRepository } from './repositories/AppSettingsRepository';
import { RoleRepository } from './repositories/RoleRepository';
import { BackupRepository } from './repositories/BackupRepository';

export interface AppRepositories {
  system: SystemRepository;
  auth: AuthRepository;
  users: UserRepository;
  dailyMacros: DailyMacrosRepository;
  reports: ReportsRepository;
  userSettings: UserSettingsRepository;
  drafts: DraftsRepository;
  recipes: RecipeRepository;
  foodItems: FoodItemRepository;
  appSettings: AppSettingsRepository;
  roles: RoleRepository;
  backup: BackupRepository;
}

export function createRepositories(
  http: IHttpClient = defaultHttpClient,
  tokenStorage: ITokenStorage = defaultTokenStorage
): AppRepositories {
  return {
    system: new SystemRepository(http),
    auth: new AuthRepository(http, tokenStorage),
    users: new UserRepository(http),
    dailyMacros: new DailyMacrosRepository(http),
    reports: new ReportsRepository(http),
    userSettings: new UserSettingsRepository(http),
    drafts: new DraftsRepository(http),
    recipes: new RecipeRepository(http),
    foodItems: new FoodItemRepository(http),
    appSettings: new AppSettingsRepository(http),
    roles: new RoleRepository(http),
    backup: new BackupRepository(http)
  };
}

export const repositories: AppRepositories = createRepositories();

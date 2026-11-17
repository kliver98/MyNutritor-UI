import type { User } from '../auth/User';
import type { MealBreakdownItem } from '../reports/MealReportFormat';

export interface DailyMacro {
  date: string; // YYYY-MM-DD
  userId: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  targetCalories?: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatsGrams?: number;
}

export interface UserReport {
  id: string;
  userId: string;
  title: string;
  generatedAt: string;
  timestamp?: string;
  fullContent?: string;
  periodStart?: string;
  periodEnd?: string;
  summary: {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFats: number;
  };
  details?: Record<string, unknown>;
  items?: MealBreakdownItem[];
}

export interface UserSettings {
  userId: string;
  themePreference: 'light' | 'dark' | 'system';
  customBackgroundColor?: string;
  customBackgroundColorRaw?: number | string;
  customColorPresets?: string[];
  measurementUnit: 'metric' | 'imperial';
  dailyCalorieGoal?: number;
  dailyProteinGoal?: number;
  dailyCarbsGoal?: number;
  dailyFatsGoal?: number;
  notificationsEnabled: boolean;
}

export interface FoodExclusion {
  userId: string;
  excludedFoodIds: string[];
  allergens: string[];
  dietaryRestrictions: string[];
  notes?: string;
}

export interface MealDraft {
  id: string;
  userId: string;
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  estimatedCalories?: number;
  createdAt: string;
}

export interface DraftPrompt {
  id: string;
  userId: string;
  promptText: string;
  aiSuggestedMeal?: string;
  createdAt: string;
}

export interface IUserRepository {
  getAll(): Promise<User[]>;
  getById(usernameOrId: string): Promise<User>;
  create(user: Partial<User> & { password?: string }): Promise<User>;
  update(usernameOrId: string, updates: Partial<User>): Promise<User>;
  delete(usernameOrId: string): Promise<boolean>;
}

export interface IDailyMacrosRepository {
  getAll(usernameOrId: string): Promise<DailyMacro[]>;
  getByDate(usernameOrId: string, dateStr: string): Promise<DailyMacro | null>;
  create(usernameOrId: string, dateStr: string, data: Partial<DailyMacro>): Promise<DailyMacro>;
  update(usernameOrId: string, dateStr: string, data: Partial<DailyMacro>): Promise<DailyMacro>;
  delete(usernameOrId: string, dateStr: string): Promise<boolean>;
}

export interface IReportsRepository {
  getAll(usernameOrId: string): Promise<UserReport[]>;
  getById(usernameOrId: string, reportId: string): Promise<UserReport>;
  create(usernameOrId: string, data: Partial<UserReport>): Promise<UserReport>;
  delete(usernameOrId: string, reportId: string): Promise<boolean>;
}

export interface IUserSettingsRepository {
  getSettings(usernameOrId: string): Promise<UserSettings>;
  updateSettings(usernameOrId: string, settings: Partial<UserSettings>): Promise<UserSettings>;
  getFoodExclusions(usernameOrId: string): Promise<FoodExclusion>;
  updateFoodExclusions(
    usernameOrId: string,
    exclusions: Partial<FoodExclusion>
  ): Promise<FoodExclusion>;
}

export interface IDraftsRepository {
  getMealDrafts(usernameOrId: string): Promise<MealDraft[]>;
  createMealDraft(usernameOrId: string, draft: Partial<MealDraft>): Promise<MealDraft>;
  deleteMealDraft(usernameOrId: string, draftId: string): Promise<boolean>;
  getDraftPrompts(usernameOrId: string): Promise<DraftPrompt[]>;
  createDraftPrompt(usernameOrId: string, promptText: string): Promise<DraftPrompt>;
  deleteDraftPrompt(usernameOrId: string, promptId: string): Promise<boolean>;
}

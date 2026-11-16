import type {
  DailyMacro,
  UserReport,
  UserSettings,
  FoodExclusion,
  MealDraft,
  DraftPrompt
} from '../../domain/users/UserManagement';
import {
  DailyMacroDtoSchema,
  ReportDtoSchema,
  UserSettingsDtoSchema,
  FoodExclusionDtoSchema,
  MealDraftDtoSchema,
  DraftPromptDtoSchema
} from '../dtos/users.dto';
import { unwrapData, unwrapList } from './mapper-utils';
import { roundToDecimals, parseColorToCss, cssColorToArgbInt } from '../../core/utils/format';

export class DailyMacrosMapper {
  static toDomain(raw: unknown): DailyMacro {
    const unwrapped = unwrapData(raw);
    const parsed = DailyMacroDtoSchema.parse(unwrapped);
    return {
      date: parsed.dateStr || parsed.date || parsed.id || '',
      userId: parsed.userId || parsed.user_id || '',
      calories: roundToDecimals(parsed.consumedCalories ?? parsed.calories ?? 0, 0),
      proteinGrams: roundToDecimals(
        parsed.proteinGrams ?? parsed.protein_grams ?? parsed.protein ?? 0,
        2
      ),
      carbsGrams: roundToDecimals(
        parsed.carbGrams ?? parsed.carbsGrams ?? parsed.carbs_grams ?? parsed.carbs ?? 0,
        2
      ),
      fatsGrams: roundToDecimals(
        parsed.fatGrams ?? parsed.fatsGrams ?? parsed.fats_grams ?? parsed.fats ?? 0,
        2
      ),
      targetCalories:
        parsed.targetCalories !== undefined || parsed.target_calories !== undefined
          ? roundToDecimals(parsed.targetCalories ?? parsed.target_calories, 0)
          : undefined,
      targetProteinGrams:
        parsed.targetProteinGrams !== undefined || parsed.target_protein_grams !== undefined
          ? roundToDecimals(parsed.targetProteinGrams ?? parsed.target_protein_grams, 2)
          : undefined,
      targetCarbsGrams:
        parsed.targetCarbsGrams !== undefined || parsed.target_carbs_grams !== undefined
          ? roundToDecimals(parsed.targetCarbsGrams ?? parsed.target_carbs_grams, 2)
          : undefined,
      targetFatsGrams:
        parsed.targetFatsGrams !== undefined || parsed.target_fats_grams !== undefined
          ? roundToDecimals(parsed.targetFatsGrams ?? parsed.target_fats_grams, 2)
          : undefined
    };
  }

  static toDomainList(raw: unknown): DailyMacro[] {
    const list = unwrapList(raw);
    return list.map((item) => DailyMacrosMapper.toDomain(item));
  }

  /**
   * Representación permitida por el esquema inmutable de [users/{username}/daily_macros]:
   * ["id", "dateStr", "displayDate", "consumedCalories", "targetCalories", "proteinGrams", "fatGrams", "carbGrams"]
   */
  static toPersistenceDto(macro: Partial<DailyMacro>, dateStr: string): Record<string, unknown> {
    const consumedCalories = macro.calories !== undefined ? roundToDecimals(macro.calories, 0) : 0;
    const targetCalories =
      macro.targetCalories !== undefined ? roundToDecimals(macro.targetCalories, 0) : 2200;
    const proteinGrams =
      macro.proteinGrams !== undefined ? roundToDecimals(macro.proteinGrams, 2) : 0;
    const fatGrams = macro.fatsGrams !== undefined ? roundToDecimals(macro.fatsGrams, 2) : 0;
    const carbGrams = macro.carbsGrams !== undefined ? roundToDecimals(macro.carbsGrams, 2) : 0;

    const dto: Record<string, unknown> = {
      id: dateStr,
      dateStr,
      displayDate: dateStr,
      consumedCalories,
      targetCalories,
      proteinGrams,
      fatGrams,
      carbGrams
    };

    return Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
  }
}

export class ReportsMapper {
  static toDomain(raw: unknown): UserReport {
    const unwrapped = unwrapData(raw);
    const parsed = ReportDtoSchema.parse(unwrapped);

    let parsedContent: {
      periodStart?: string;
      periodEnd?: string;
      summary?: {
        averageCalories?: number;
        averageProtein?: number;
        averageCarbs?: number;
        averageFats?: number;
      };
      details?: Record<string, unknown>;
    } = {};

    const rawContent = parsed.fullContent || parsed.full_content;
    if (rawContent && typeof rawContent === 'string' && rawContent.startsWith('{')) {
      try {
        parsedContent = JSON.parse(rawContent);
      } catch {
        // Ignorar si no es json válido
      }
    }

    const summary = parsed.summary || parsedContent.summary || {};
    return {
      id: parsed.id,
      userId: parsed.userId || parsed.user_id || '',
      title: parsed.title,
      generatedAt:
        parsed.timestamp || parsed.generatedAt || parsed.generated_at || new Date().toISOString(),
      periodStart: parsed.periodStart || parsed.period_start || parsedContent.periodStart || '',
      periodEnd: parsed.periodEnd || parsed.period_end || parsedContent.periodEnd || '',
      summary: {
        averageCalories: roundToDecimals(
          summary.averageCalories ?? summary.average_calories ?? 0,
          0
        ),
        averageProtein: roundToDecimals(summary.averageProtein ?? summary.average_protein ?? 0, 2),
        averageCarbs: roundToDecimals(summary.averageCarbs ?? summary.average_carbs ?? 0, 2),
        averageFats: roundToDecimals(summary.averageFats ?? summary.average_fats ?? 0, 2)
      },
      details: parsed.details || parsedContent.details
    };
  }

  static toDomainList(raw: unknown): UserReport[] {
    const list = unwrapList(raw);
    return list.map((item) => ReportsMapper.toDomain(item));
  }

  /**
   * Representación permitida por el esquema inmutable de [users/{username}/reports]:
   * ["id", "title", "timestamp", "fullContent", "userId"]
   */
  static toPersistenceDto(report: Partial<UserReport>, username?: string): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      title: report.title || 'Informe Nutricional',
      timestamp: report.generatedAt || new Date().toISOString(),
      fullContent: JSON.stringify({
        periodStart: report.periodStart || '',
        periodEnd: report.periodEnd || '',
        summary: report.summary || {
          averageCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFats: 0
        },
        details: report.details || {}
      }),
      userId: report.userId || username || ''
    };
    if (report.id) payload.id = report.id;
    return payload;
  }
}

export class UserSettingsMapper {
  static toSettingsDomain(raw: unknown): UserSettings {
    const unwrapped = unwrapData(raw);
    const parsed = UserSettingsDtoSchema.parse(unwrapped);

    // Mapear themeMode a themePreference ('DARK' | 'LIGHT' | 'SYSTEM' -> 'dark' | 'light' | 'system')
    let themePreference: 'light' | 'dark' | 'system' = 'system';
    const rawTheme = (
      (unwrapped as { themeMode?: string })?.themeMode ||
      parsed.themeMode ||
      parsed.themePreference ||
      parsed.theme_preference ||
      ''
    ).toLowerCase();
    if (rawTheme === 'dark') themePreference = 'dark';
    else if (rawTheme === 'light') themePreference = 'light';

    // Mapear customBackgroundColor (Firestore puede almacenar -14651472 como entero firmado ARGB de 32 bits)
    const rawBg =
      (unwrapped as { customBackgroundColor?: unknown; custom_background_color?: unknown })
        ?.customBackgroundColor ??
      (unwrapped as { custom_background_color?: unknown })?.custom_background_color ??
      parsed.customBackgroundColor ??
      parsed.custom_background_color;

    const customBackgroundColor = parseColorToCss(rawBg);

    // Mapear presets de colores
    const rawPresets =
      (unwrapped as { customColorPresets?: unknown[] })?.customColorPresets ||
      parsed.customColorPresets ||
      parsed.custom_color_presets ||
      [];
    const customColorPresets = rawPresets
      .map((p) => parseColorToCss(p))
      .filter((p): p is string => Boolean(p));

    return {
      userId: parsed.userId || parsed.user_id || '',
      themePreference,
      customBackgroundColor,
      customBackgroundColorRaw:
        typeof rawBg === 'number' || typeof rawBg === 'string' ? rawBg : undefined,
      customColorPresets: customColorPresets.length > 0 ? customColorPresets : undefined,
      measurementUnit: parsed.measurementUnit || parsed.measurement_unit || 'metric',
      dailyCalorieGoal: parsed.dailyCalorieGoal ?? parsed.daily_calorie_goal,
      dailyProteinGoal: parsed.dailyProteinGoal ?? parsed.daily_protein_goal,
      dailyCarbsGoal: parsed.dailyCarbsGoal ?? parsed.daily_carbs_goal,
      dailyFatsGoal: parsed.dailyFatsGoal ?? parsed.daily_fats_goal,
      notificationsEnabled: parsed.notificationsEnabled ?? parsed.notifications_enabled ?? true
    };
  }

  /**
   * Representación permitida por el esquema inmutable de [users/{username}/user_settings/config]:
   * ["id", "themeMode", "selectedModel", "geminiApiKey", "customBackgroundColor", "customColorPresets", "lastUpdated"]
   */
  static toPersistenceDto(settings: Partial<UserSettings>): Record<string, unknown> {
    const dto: Record<string, unknown> = {};
    if (settings.themePreference) {
      dto.themeMode = settings.themePreference.toUpperCase();
    }
    if (settings.customBackgroundColor !== undefined) {
      dto.customBackgroundColor =
        settings.customBackgroundColorRaw ??
        (settings.customBackgroundColor ? cssColorToArgbInt(settings.customBackgroundColor) : 0);
    }
    return dto;
  }

  static toExclusionsDomain(raw: unknown): FoodExclusion {
    const unwrapped = unwrapData(raw);
    const parsed = FoodExclusionDtoSchema.parse(unwrapped);
    return {
      userId: parsed.userId || parsed.user_id || '',
      excludedFoodIds:
        parsed.excludedIds || parsed.excludedFoodIds || parsed.excluded_food_ids || [],
      allergens: parsed.allergens || [],
      dietaryRestrictions: parsed.dietaryRestrictions || parsed.dietary_restrictions || [],
      notes: parsed.notes
    };
  }
}

export class DraftsMapper {
  static toMealDraftDomain(raw: unknown): MealDraft {
    const unwrapped = unwrapData(raw);
    const parsed = MealDraftDtoSchema.parse(unwrapped);
    return {
      id: parsed.id,
      userId: parsed.userId || parsed.user_id || '',
      title: parsed.title,
      mealType: parsed.mealType || parsed.meal_type || 'lunch',
      ingredients: parsed.ingredients,
      estimatedCalories: parsed.estimatedCalories ?? parsed.estimated_calories,
      createdAt: parsed.createdAt || parsed.created_at || new Date().toISOString()
    };
  }

  static toMealDraftDomainList(raw: unknown): MealDraft[] {
    const list = unwrapList(raw);
    return list.map((item) => DraftsMapper.toMealDraftDomain(item));
  }

  /**
   * Representación permitida por el esquema inmutable de [users/{username}/meal_drafts]:
   * ["id", "title", "mealTitleInput", "foodQuantities", "recipeQuantities", "deleteAfterReport", "timestamp"]
   */
  static toPersistenceDto(draft: Omit<MealDraft, 'id' | 'createdAt'>): Record<string, unknown> {
    return {
      title: draft.title,
      mealTitleInput: draft.title,
      foodQuantities: [],
      recipeQuantities: [],
      deleteAfterReport: false,
      timestamp: Date.now()
    };
  }

  static toDraftPromptDomain(raw: unknown): DraftPrompt {
    const unwrapped = unwrapData(raw);
    const parsed = DraftPromptDtoSchema.parse(unwrapped);
    return {
      id: parsed.id,
      userId: parsed.userId || parsed.user_id || '',
      promptText: parsed.promptText || parsed.prompt_text || '',
      aiSuggestedMeal: parsed.aiSuggestedMeal || parsed.ai_suggested_meal,
      createdAt: parsed.createdAt || parsed.created_at || new Date().toISOString()
    };
  }

  static toDraftPromptDomainList(raw: unknown): DraftPrompt[] {
    const list = unwrapList(raw);
    return list.map((item) => DraftsMapper.toDraftPromptDomain(item));
  }
}

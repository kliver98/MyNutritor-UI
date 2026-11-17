import { z } from 'zod';

export const DailyMacroDtoSchema = z
  .object({
    id: z.string().optional(),
    date: z.string().optional(),
    dateStr: z.string().optional(),
    displayDate: z.string().optional(),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    calories: z.number().optional().default(0),
    consumedCalories: z.number().optional(),
    protein_grams: z.number().optional(),
    proteinGrams: z.number().optional(),
    protein: z.number().optional(),
    carbs_grams: z.number().optional(),
    carbsGrams: z.number().optional(),
    carbGrams: z.number().optional(),
    carbs: z.number().optional(),
    fats_grams: z.number().optional(),
    fatsGrams: z.number().optional(),
    fatGrams: z.number().optional(),
    fats: z.number().optional(),
    target_calories: z.number().optional(),
    targetCalories: z.number().optional(),
    target_protein_grams: z.number().optional(),
    targetProteinGrams: z.number().optional(),
    target_carbs_grams: z.number().optional(),
    targetCarbsGrams: z.number().optional(),
    target_fats_grams: z.number().optional(),
    targetFatsGrams: z.number().optional()
  })
  .passthrough();

export type DailyMacroDto = z.infer<typeof DailyMacroDtoSchema>;

export const ReportDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    title: z.string().optional().default('Informe Nutricional'),
    timestamp: z.unknown().optional(),
    fullContent: z.string().optional(),
    full_content: z.string().optional(),
    generated_at: z.unknown().optional(),
    generatedAt: z.unknown().optional(),
    created_at: z.unknown().optional(),
    createdAt: z.unknown().optional(),
    period_start: z.string().optional(),
    periodStart: z.string().optional(),
    period_end: z.string().optional(),
    periodEnd: z.string().optional(),
    summary: z
      .object({
        average_calories: z.number().optional(),
        averageCalories: z.number().optional(),
        average_protein: z.number().optional(),
        averageProtein: z.number().optional(),
        average_carbs: z.number().optional(),
        averageCarbs: z.number().optional(),
        average_fats: z.number().optional(),
        averageFats: z.number().optional()
      })
      .optional()
      .default({}),
    details: z.record(z.unknown()).optional()
  })
  .passthrough();

export type ReportDto = z.infer<typeof ReportDtoSchema>;

export const UserSettingsDtoSchema = z
  .object({
    user_id: z.string().optional(),
    userId: z.string().optional(),
    theme_preference: z.enum(['light', 'dark', 'system']).optional(),
    themePreference: z.enum(['light', 'dark', 'system']).optional(),
    themeMode: z.string().optional(),
    customBackgroundColor: z.union([z.number(), z.string()]).optional(),
    custom_background_color: z.union([z.number(), z.string()]).optional(),
    customColorPresets: z.array(z.union([z.number(), z.string()])).optional(),
    custom_color_presets: z.array(z.union([z.number(), z.string()])).optional(),
    measurement_unit: z.enum(['metric', 'imperial']).optional(),
    measurementUnit: z.enum(['metric', 'imperial']).optional(),
    daily_calorie_goal: z.number().optional(),
    dailyCalorieGoal: z.number().optional(),
    daily_protein_goal: z.number().optional(),
    dailyProteinGoal: z.number().optional(),
    daily_carbs_goal: z.number().optional(),
    dailyCarbsGoal: z.number().optional(),
    daily_fats_goal: z.number().optional(),
    dailyFatsGoal: z.number().optional(),
    notifications_enabled: z.boolean().optional(),
    notificationsEnabled: z.boolean().optional()
  })
  .passthrough();

export type UserSettingsDto = z.infer<typeof UserSettingsDtoSchema>;

export const FoodExclusionDtoSchema = z
  .object({
    user_id: z.string().optional(),
    userId: z.string().optional(),
    excluded_food_ids: z.array(z.string()).optional(),
    excludedFoodIds: z.array(z.string()).optional().default([]),
    excludedIds: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional().default([]),
    dietary_restrictions: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional().default([]),
    notes: z.string().optional()
  })
  .passthrough();

export type FoodExclusionDto = z.infer<typeof FoodExclusionDtoSchema>;

export const MealDraftDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    title: z.string(),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional().default('lunch'),
    ingredients: z
      .array(
        z.object({
          name: z.string(),
          amount: z.number(),
          unit: z.string()
        })
      )
      .optional()
      .default([]),
    estimated_calories: z.number().optional(),
    estimatedCalories: z.number().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional()
  })
  .passthrough();

export type MealDraftDto = z.infer<typeof MealDraftDtoSchema>;

export const DraftPromptDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    prompt_text: z.string().optional(),
    promptText: z.string().optional(),
    ai_suggested_meal: z.string().optional(),
    aiSuggestedMeal: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional()
  })
  .passthrough();

export type DraftPromptDto = z.infer<typeof DraftPromptDtoSchema>;

import { z } from 'zod';

export const RecipeIngredientDtoSchema = z
  .object({
    food_item_id: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? String(v) : undefined)),
    foodItemId: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? String(v) : undefined)),
    name: z.string().optional(),
    title: z.string().optional(),
    foodItemTitle: z.string().optional(),
    food_item_title: z.string().optional(),
    foodItemName: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    quantity: z.union([z.number(), z.string()]).optional(),
    quantityText: z.string().optional(),
    unit: z.string().optional().default('g'),
    notes: z.string().optional()
  })
  .passthrough();

export const RecipePermissionsDtoSchema = z
  .object({
    is_public: z.boolean().optional(),
    isPublic: z.boolean().optional().default(false),
    shared_with_user_ids: z.array(z.string()).optional(),
    sharedWithUserIds: z.array(z.string()).optional().default([])
  })
  .passthrough();

export const RecipeDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    title: z.string(),
    description: z.string().optional().default(''),
    servings: z.number().optional().default(1),
    prep_time_minutes: z.number().optional(),
    prepTimeMinutes: z.number().optional(),
    cook_time_minutes: z.number().optional(),
    cookTimeMinutes: z.number().optional(),
    ingredients: z.array(RecipeIngredientDtoSchema).optional().default([]),
    instructions: z.array(z.string()).optional().default([]),
    macros: z
      .object({
        calories_per_serving: z.number().optional(),
        caloriesPerServing: z.number().optional(),
        protein_grams: z.number().optional(),
        proteinGrams: z.number().optional(),
        carbs_grams: z.number().optional(),
        carbsGrams: z.number().optional(),
        fats_grams: z.number().optional(),
        fatsGrams: z.number().optional()
      })
      .optional()
      .default({}),
    author_id: z.string().optional(),
    authorId: z.string().optional().default(''),
    author_username: z.string().optional(),
    authorUsername: z.string().optional(),
    ownerUserId: z.string().optional(),
    isPublic: z.boolean().optional(),
    totalCalories: z.number().optional(),
    totalProteinGrams: z.number().optional(),
    totalCarbGrams: z.number().optional(),
    totalFatGrams: z.number().optional(),
    ingredientsJson: z.string().optional(),
    additionalNutrientsJson: z.string().optional(),
    permissions: RecipePermissionsDtoSchema.optional().default({
      isPublic: false,
      sharedWithUserIds: []
    }),
    tags: z.array(z.string()).optional().default([]),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
    updated_at: z.string().optional(),
    updatedAt: z.string().optional()
  })
  .passthrough();

export type RecipeDto = z.infer<typeof RecipeDtoSchema>;
export type RecipePermissionsDto = z.infer<typeof RecipePermissionsDtoSchema>;

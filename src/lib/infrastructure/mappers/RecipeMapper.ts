import type { Recipe, RecipeIngredient, RecipePermissions } from '../../domain/recipes/Recipe';
import { RecipeDtoSchema, RecipePermissionsDtoSchema } from '../dtos/recipes.dto';
import { unwrapData, unwrapList } from './mapper-utils';
import { roundToDecimals } from '../../core/utils/format';

export class RecipeMapper {
  static toDomain(raw: unknown): Recipe {
    const unwrapped = unwrapData(raw);
    const parsed = RecipeDtoSchema.parse(unwrapped);

    // If ingredients array is empty, check if ingredientsJson string is provided
    let ingredients: RecipeIngredient[] = parsed.ingredients.map((ing) => ({
      foodItemId: ing.foodItemId || ing.food_item_id,
      name: ing.name,
      amount: roundToDecimals(ing.amount, 2),
      unit: ing.unit,
      notes: ing.notes
    }));

    if (ingredients.length === 0 && parsed.ingredientsJson) {
      try {
        const parsedJson = JSON.parse(parsed.ingredientsJson);
        if (Array.isArray(parsedJson)) {
          ingredients = parsedJson.map((item: Record<string, unknown>) => ({
            foodItemId: String(item.foodItemId || item.food_item_id || ''),
            name: String(item.name || item.title || 'Ingrediente'),
            amount: roundToDecimals(Number(item.amount || item.quantity || 1), 2),
            unit: String(item.unit || 'g'),
            notes: item.notes ? String(item.notes) : undefined
          }));
        }
      } catch {
        // Ignorar error al parsear JSON no válido
      }
    }

    const isPublic =
      parsed.isPublic === true ||
      parsed.permissions?.isPublic === true ||
      parsed.permissions?.is_public === true;

    // Extraer campos secundarios desde additionalNutrientsJson si existen
    let servings = parsed.servings ?? 1;
    let prepTimeMinutes = parsed.prepTimeMinutes ?? parsed.prep_time_minutes;
    let cookTimeMinutes = parsed.cookTimeMinutes ?? parsed.cook_time_minutes;
    let instructions = parsed.instructions || [];
    let tags = parsed.tags || [];

    if (parsed.additionalNutrientsJson) {
      try {
        const extra = JSON.parse(parsed.additionalNutrientsJson);
        if (extra.servings !== undefined && typeof extra.servings === 'number') {
          servings = extra.servings;
        }
        if (extra.prepTimeMinutes !== undefined && typeof extra.prepTimeMinutes === 'number') {
          prepTimeMinutes = extra.prepTimeMinutes;
        }
        if (extra.cookTimeMinutes !== undefined && typeof extra.cookTimeMinutes === 'number') {
          cookTimeMinutes = extra.cookTimeMinutes;
        }
        if (Array.isArray(extra.instructions) && instructions.length === 0) {
          instructions = extra.instructions.map(String);
        }
        if (Array.isArray(extra.tags) && tags.length === 0) {
          tags = extra.tags.map(String);
        }
      } catch {
        // Ignorar error al parsear additionalNutrientsJson
      }
    }

    const caloriesPerServing = roundToDecimals(
      parsed.macros.caloriesPerServing ??
        parsed.macros.calories_per_serving ??
        parsed.totalCalories ??
        0,
      0
    );

    const proteinGrams = roundToDecimals(
      parsed.macros.proteinGrams ?? parsed.macros.protein_grams ?? parsed.totalProteinGrams ?? 0,
      2
    );

    const carbsGrams = roundToDecimals(
      parsed.macros.carbsGrams ?? parsed.macros.carbs_grams ?? parsed.totalCarbGrams ?? 0,
      2
    );

    const fatsGrams = roundToDecimals(
      parsed.macros.fatsGrams ?? parsed.macros.fats_grams ?? parsed.totalFatGrams ?? 0,
      2
    );

    return {
      id: parsed.id,
      title: parsed.title,
      description: parsed.description,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      ingredients,
      instructions,
      macros: {
        caloriesPerServing,
        proteinGrams,
        carbsGrams,
        fatsGrams
      },
      authorId: parsed.authorId || parsed.author_id || parsed.ownerUserId || '',
      authorUsername: parsed.authorUsername || parsed.author_username,
      permissions: {
        isPublic,
        sharedWithUserIds:
          parsed.permissions.sharedWithUserIds || parsed.permissions.shared_with_user_ids || []
      },
      tags,
      createdAt: parsed.createdAt || parsed.created_at || new Date().toISOString(),
      updatedAt: parsed.updatedAt || parsed.updated_at
    };
  }

  static toDomainList(raw: unknown): Recipe[] {
    const list = unwrapList(raw);
    return list.map((item) => RecipeMapper.toDomain(item));
  }

  /**
   * Transforma la entidad de dominio Recipe a la representación estricta
   * permitida por el backend en [recipes]:
   * ["id", "ownerUserId", "isPublic", "title", "description", "iconOrImageUrl",
   *  "totalCalories", "totalProteinGrams", "totalFatGrams", "totalCarbGrams",
   *  "ingredientsJson", "additionalNutrientsJson"]
   */
  static toPersistenceDto(
    recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> | Partial<Recipe>
  ): Record<string, unknown> {
    const ingredientsPayload = (recipe.ingredients || []).map((ing) => ({
      foodItemId: ing.foodItemId || '',
      foodItemTitle: ing.name || 'Ingrediente',
      quantityText: `${ing.amount}${ing.unit || 'g'}`,
      calories: 0,
      proteinGrams: 0,
      fatGrams: 0,
      carbGrams: 0
    }));

    const extra = {
      servings: recipe.servings || 1,
      prepTimeMinutes: recipe.prepTimeMinutes || 0,
      cookTimeMinutes: recipe.cookTimeMinutes || 0,
      instructions: recipe.instructions || [],
      tags: recipe.tags || []
    };

    const dto: Record<string, unknown> = {
      title: (recipe.title || 'Receta').trim(),
      description: recipe.description?.trim() || '',
      totalCalories:
        recipe.macros?.caloriesPerServing !== undefined
          ? roundToDecimals(recipe.macros.caloriesPerServing, 0)
          : 0,
      totalProteinGrams:
        recipe.macros?.proteinGrams !== undefined
          ? roundToDecimals(recipe.macros.proteinGrams, 2)
          : 0,
      totalFatGrams:
        recipe.macros?.fatsGrams !== undefined ? roundToDecimals(recipe.macros.fatsGrams, 2) : 0,
      totalCarbGrams:
        recipe.macros?.carbsGrams !== undefined ? roundToDecimals(recipe.macros.carbsGrams, 2) : 0,
      ingredientsJson: JSON.stringify(ingredientsPayload),
      additionalNutrientsJson: JSON.stringify(extra),
      isPublic: recipe.permissions?.isPublic ?? false,
      iconOrImageUrl: ''
    };

    return Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
  }

  static toPermissionsDomain(raw: unknown): RecipePermissions {
    const unwrapped = unwrapData(raw);
    const parsed = RecipePermissionsDtoSchema.parse(unwrapped);
    return {
      isPublic: parsed.isPublic ?? parsed.is_public ?? false,
      sharedWithUserIds: parsed.sharedWithUserIds || parsed.shared_with_user_ids || []
    };
  }
}

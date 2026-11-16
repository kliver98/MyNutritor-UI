import type { FoodItem } from '../../domain/food-items/FoodItem';
import { FoodItemDtoSchema } from '../dtos/food-items.dto';
import { unwrapData, unwrapList } from './mapper-utils';
import { roundToDecimals } from '../../core/utils/format';

export class FoodItemMapper {
  static toDomain(raw: unknown): FoodItem {
    const unwrapped = unwrapData(raw);
    const parsed = FoodItemDtoSchema.parse(unwrapped);

    let servingSize = 100;
    let servingUnit = parsed.servingUnit || parsed.serving_unit || 'g';
    const rawServing = parsed.servingSize ?? parsed.serving_size;
    if (typeof rawServing === 'number') {
      servingSize = roundToDecimals(rawServing, 2);
    } else if (typeof rawServing === 'string') {
      const matchNum = parseFloat(rawServing);
      if (!isNaN(matchNum)) servingSize = roundToDecimals(matchNum, 2);
      const unit = rawServing.replace(/[0-9.]/g, '').trim();
      if (unit) servingUnit = unit;
    }

    let category = parsed.category;
    let fiberGrams =
      parsed.fiberGrams !== undefined || parsed.fiber_grams !== undefined
        ? roundToDecimals(parsed.fiberGrams ?? parsed.fiber_grams, 2)
        : undefined;
    let sodiumMg =
      parsed.sodiumMg !== undefined || parsed.sodium_mg !== undefined
        ? roundToDecimals(parsed.sodiumMg ?? parsed.sodium_mg, 2)
        : undefined;

    // Extraer campos guardados en additionalNutrientsJson respetando el esquema inmutable del backend
    if (parsed.additionalNutrientsJson) {
      try {
        const extra = JSON.parse(parsed.additionalNutrientsJson);
        if (!category && (extra['Categoría'] || extra['category'] || extra['Categoria'])) {
          category = String(extra['Categoría'] || extra['category'] || extra['Categoria']);
        }
        if (
          fiberGrams === undefined &&
          (extra['Fibra Dietaria'] || extra['Fibra dietaria'] || extra['Fibra Dietética'])
        ) {
          const rawFiber = parseFloat(
            String(extra['Fibra Dietaria'] || extra['Fibra dietaria'] || extra['Fibra Dietética'])
          );
          if (!isNaN(rawFiber)) fiberGrams = roundToDecimals(rawFiber, 2);
        }
        if (sodiumMg === undefined && (extra['Sodio'] || extra['sodio'])) {
          const rawSodium = parseFloat(String(extra['Sodio'] || extra['sodio']));
          if (!isNaN(rawSodium)) sodiumMg = roundToDecimals(rawSodium, 2);
        }
      } catch {
        // Ignorar parseo si no es JSON válido
      }
    }

    return {
      id: parsed.id,
      name: parsed.title || parsed.name || 'Alimento',
      brand: parsed.brand ?? undefined,
      servingSize,
      servingUnit,
      calories: roundToDecimals(parsed.calories ?? 0, 0),
      proteinGrams: roundToDecimals(
        parsed.proteinGrams ?? parsed.protein_grams ?? parsed.protein ?? 0,
        2
      ),
      carbsGrams: roundToDecimals(
        parsed.carbGrams ??
          parsed.carbsGrams ??
          parsed.totalCarbGrams ??
          parsed.carbs_grams ??
          parsed.carbs ??
          0,
        2
      ),
      fatsGrams: roundToDecimals(
        parsed.fatGrams ??
          parsed.fatsGrams ??
          parsed.totalFatGrams ??
          parsed.fats_grams ??
          parsed.fats ??
          0,
        2
      ),
      fiberGrams,
      sodiumMg,
      category,
      barcode: parsed.barcode,
      isVerified: parsed.isVerified ?? parsed.is_verified ?? false,
      ownerUserId: parsed.ownerUserId || undefined,
      isPublic: parsed.isPublic ?? true,
      iconOrImageUrl:
        parsed.iconOrImageUrl ||
        parsed.icon_or_image_url ||
        parsed.imageUrl ||
        parsed.image ||
        parsed.icon ||
        undefined
    };
  }

  static toDomainList(raw: unknown): FoodItem[] {
    const list = unwrapList(raw);
    return list.map((item) => FoodItemMapper.toDomain(item));
  }

  /**
   * Transforma la entidad de dominio FoodItem a la representación estricta
   * esperada por el esquema inmutable de [food_items] en Firestore/Cloud Run:
   * ["id", "ownerUserId", "isPublic", "title", "brand", "servingSize", "iconOrImageUrl",
   *  "calories", "proteinGrams", "fatGrams", "carbGrams", "additionalNutrientsJson"]
   */
  static toPersistenceDto(item: Omit<FoodItem, 'id'> | Partial<FoodItem>): Record<string, unknown> {
    const servingSizeStr =
      typeof item.servingSize === 'number'
        ? `${roundToDecimals(item.servingSize, 2)}${item.servingUnit || 'g'}`
        : item.servingSize || '100g';

    const extra: Record<string, unknown> = {};
    if (item.fiberGrams !== undefined) {
      extra['Fibra Dietaria'] = `${roundToDecimals(item.fiberGrams, 2)}g`;
    }
    if (item.sodiumMg !== undefined) {
      extra['Sodio'] = `${roundToDecimals(item.sodiumMg, 2)}mg`;
    }

    const dto: Record<string, unknown> = {
      title: (item.name || 'Alimento').trim(),
      brand: item.brand?.trim() || undefined,
      servingSize: servingSizeStr,
      calories: item.calories !== undefined ? roundToDecimals(item.calories, 0) : 0,
      proteinGrams: item.proteinGrams !== undefined ? roundToDecimals(item.proteinGrams, 2) : 0,
      fatGrams: item.fatsGrams !== undefined ? roundToDecimals(item.fatsGrams, 2) : 0,
      carbGrams: item.carbsGrams !== undefined ? roundToDecimals(item.carbsGrams, 2) : 0,
      isPublic: item.isVerified ?? true,
      iconOrImageUrl: item.iconOrImageUrl?.trim() || undefined,
      additionalNutrientsJson: Object.keys(extra).length > 0 ? JSON.stringify(extra) : '{}'
    };

    return Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
  }
}

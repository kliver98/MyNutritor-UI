import { z } from 'zod';

export const FoodItemDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    name: z.string().optional(),
    title: z.string().optional(),
    brand: z.string().nullable().optional(),
    serving_size: z.union([z.number(), z.string()]).optional(),
    servingSize: z.union([z.number(), z.string()]).optional(),
    serving_unit: z.string().optional(),
    servingUnit: z.string().optional(),
    calories: z.number().default(0),
    protein_grams: z.number().optional(),
    proteinGrams: z.number().optional(),
    protein: z.number().optional().default(0),
    carbs_grams: z.number().optional(),
    carbsGrams: z.number().optional(),
    carbGrams: z.number().optional(),
    totalCarbGrams: z.number().optional(),
    carbs: z.number().optional().default(0),
    fats_grams: z.number().optional(),
    fatsGrams: z.number().optional(),
    fatGrams: z.number().optional(),
    totalFatGrams: z.number().optional(),
    fats: z.number().optional().default(0),
    fiber_grams: z.number().optional(),
    fiberGrams: z.number().optional(),
    sodium_mg: z.number().optional(),
    sodiumMg: z.number().optional(),
    category: z.string().optional(),
    barcode: z.string().optional(),
    is_verified: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    ownerUserId: z.string().optional(),
    iconOrImageUrl: z.string().optional(),
    icon_or_image_url: z.string().optional(),
    imageUrl: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
    additionalNutrientsJson: z.string().optional()
  })
  .passthrough();

export type FoodItemDto = z.infer<typeof FoodItemDtoSchema>;

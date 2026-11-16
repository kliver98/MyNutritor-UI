export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  category?: string;
  barcode?: string;
  isVerified?: boolean;
  ownerUserId?: string;
  isPublic?: boolean;
  iconOrImageUrl?: string;
}

export interface IFoodItemRepository {
  getAll(params?: { search?: string; category?: string }): Promise<FoodItem[]>;
  getById(foodId: string): Promise<FoodItem>;
  create(item: Omit<FoodItem, 'id'>): Promise<FoodItem>;
  update(foodId: string, updates: Partial<FoodItem>): Promise<FoodItem>;
  delete(foodId: string): Promise<boolean>;
}

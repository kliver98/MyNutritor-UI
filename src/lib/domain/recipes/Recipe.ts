export interface RecipeIngredient {
  foodItemId?: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface RecipePermissions {
  isPublic: boolean;
  sharedWithUserIds: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  macros: {
    caloriesPerServing: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
  authorId: string;
  authorUsername?: string;
  permissions: RecipePermissions;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface IRecipeRepository {
  getAll(params?: { search?: string; tag?: string }): Promise<Recipe[]>;
  getById(recipeId: string): Promise<Recipe>;
  create(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe>;
  update(recipeId: string, updates: Partial<Recipe>): Promise<Recipe>;
  delete(recipeId: string): Promise<boolean>;
  getPermissions(recipeId: string): Promise<RecipePermissions>;
  updatePermissions(recipeId: string, permissions: RecipePermissions): Promise<RecipePermissions>;
}

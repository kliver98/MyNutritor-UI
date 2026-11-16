import type { IHttpClient } from '../../core/http/HttpClient';
import type { IRecipeRepository, Recipe, RecipePermissions } from '../../domain/recipes/Recipe';
import { RecipeMapper } from '../mappers/RecipeMapper';

export class RecipeRepository implements IRecipeRepository {
  constructor(private http: IHttpClient) {}

  async getAll(params?: { search?: string; tag?: string }): Promise<Recipe[]> {
    const res = await this.http.get<unknown[]>('/api/v1/recipes', { params });
    return RecipeMapper.toDomainList(res.data);
  }

  async getById(recipeId: string): Promise<Recipe> {
    const res = await this.http.get<unknown>(`/api/v1/recipes/${encodeURIComponent(recipeId)}`);
    return RecipeMapper.toDomain(res.data);
  }

  async create(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const payload = RecipeMapper.toPersistenceDto(recipe);
    const res = await this.http.post<unknown>('/api/v1/recipes', payload);
    return RecipeMapper.toDomain(res.data);
  }

  async update(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
    const payload = RecipeMapper.toPersistenceDto(updates);
    const res = await this.http.put<unknown>(
      `/api/v1/recipes/${encodeURIComponent(recipeId)}`,
      payload
    );
    return RecipeMapper.toDomain(res.data);
  }

  async delete(recipeId: string): Promise<boolean> {
    await this.http.delete(`/api/v1/recipes/${encodeURIComponent(recipeId)}`);
    return true;
  }

  async getPermissions(recipeId: string): Promise<RecipePermissions> {
    const res = await this.http.get<unknown>(
      `/api/v1/recipes/${encodeURIComponent(recipeId)}/permissions`
    );
    return RecipeMapper.toPermissionsDomain(res.data);
  }

  async updatePermissions(
    recipeId: string,
    permissions: RecipePermissions
  ): Promise<RecipePermissions> {
    const res = await this.http.put<unknown>(
      `/api/v1/recipes/${encodeURIComponent(recipeId)}/permissions`,
      permissions
    );
    return RecipeMapper.toPermissionsDomain(res.data);
  }
}

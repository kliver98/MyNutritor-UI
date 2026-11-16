import type { IHttpClient } from '../../core/http/HttpClient';
import type { IFoodItemRepository, FoodItem } from '../../domain/food-items/FoodItem';
import { FoodItemMapper } from '../mappers/FoodItemMapper';

export class FoodItemRepository implements IFoodItemRepository {
  constructor(private http: IHttpClient) {}

  async getAll(params?: { search?: string; category?: string }): Promise<FoodItem[]> {
    const res = await this.http.get<unknown[]>('/api/v1/food-items', { params });
    return FoodItemMapper.toDomainList(res.data);
  }

  async getById(foodId: string): Promise<FoodItem> {
    const res = await this.http.get<unknown>(`/api/v1/food-items/${encodeURIComponent(foodId)}`);
    return FoodItemMapper.toDomain(res.data);
  }

  async create(item: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const payload = FoodItemMapper.toPersistenceDto(item);
    const res = await this.http.post<unknown>('/api/v1/food-items', payload);
    return FoodItemMapper.toDomain(res.data);
  }

  async update(foodId: string, updates: Partial<FoodItem>): Promise<FoodItem> {
    const payload = FoodItemMapper.toPersistenceDto(updates);
    const res = await this.http.put<unknown>(
      `/api/v1/food-items/${encodeURIComponent(foodId)}`,
      payload
    );
    return FoodItemMapper.toDomain(res.data);
  }

  async delete(foodId: string): Promise<boolean> {
    await this.http.delete(`/api/v1/food-items/${encodeURIComponent(foodId)}`);
    return true;
  }
}

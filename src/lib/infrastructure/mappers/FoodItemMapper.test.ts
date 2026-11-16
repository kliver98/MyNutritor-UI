import { describe, it, expect } from 'vitest';
import { FoodItemMapper } from './FoodItemMapper';

describe('FoodItemMapper', () => {
  it('debe mapear un alimento directo en formato estándar', () => {
    const raw = {
      id: 'food-123',
      name: 'Pechuga de Pollo',
      brand: 'Granja Real',
      calories: 165,
      proteinGrams: 31,
      carbsGrams: 0,
      fatsGrams: 3.6,
      servingSize: 100,
      servingUnit: 'g'
    };

    const domain = FoodItemMapper.toDomain(raw);
    expect(domain.id).toBe('food-123');
    expect(domain.name).toBe('Pechuga de Pollo');
    expect(domain.proteinGrams).toBe(31);
    expect(domain.servingSize).toBe(100);
    expect(domain.servingUnit).toBe('g');
  });

  it('debe mapear alimentos reales devueltos por Cloud Run con envelope y campos alternativos (title, carbGrams, fatGrams, servingSize string)', () => {
    const cloudRunEnvelope = {
      success: true,
      statusCode: 200,
      message: 'Items obtenidos con éxito',
      data: [
        {
          id: 'food-cloud-1',
          title: 'Avena en hojuelas',
          brand: 'Quaker',
          calories: 360,
          proteinGrams: 13,
          carbGrams: 60,
          fatGrams: 7,
          servingSize: '100g',
          isPublic: true,
          ownerUserId: 'system'
        }
      ]
    };

    const list = FoodItemMapper.toDomainList(cloudRunEnvelope);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('food-cloud-1');
    expect(list[0].name).toBe('Avena en hojuelas');
    expect(list[0].carbsGrams).toBe(60);
    expect(list[0].fatsGrams).toBe(7);
    expect(list[0].proteinGrams).toBe(13);
    expect(list[0].servingSize).toBe(100);
    expect(list[0].servingUnit).toBe('g');
    expect(list[0].ownerUserId).toBe('system');
    expect(list[0].isPublic).toBe(true);
  });

  it('debe redondear automáticamente a máximo 2 decimales números con artefactos de punto flotante de la API', () => {
    const rawWithDecimals = {
      id: 'food-decimals-1',
      title: 'Trozos de Pechuga de Pollo Apanados',
      calories: 208,
      proteinGrams: 18.0000001,
      carbGrams: 13.0000002,
      fatGrams: parseFloat('9.3000000190734863'),
      servingSize: '100g'
    };

    const domain = FoodItemMapper.toDomain(rawWithDecimals);
    expect(domain.fatsGrams).toBe(9.3);
    expect(domain.proteinGrams).toBe(18);
    expect(domain.carbsGrams).toBe(13);
  });

  it('debe transformar la entidad de dominio a DTO de persistencia cumpliendo el esquema inmutable de [food_items]', () => {
    const domainItem = {
      name: 'Pechuga a la plancha',
      brand: 'Casero',
      servingSize: 150,
      servingUnit: 'g',
      calories: 180,
      proteinGrams: 35.5,
      carbsGrams: 0,
      fatsGrams: 4.2,
      category: 'Carnes',
      isVerified: true
    };

    const persistenceDto = FoodItemMapper.toPersistenceDto(domainItem);

    // Campos estrictamente permitidos
    expect(persistenceDto.title).toBe('Pechuga a la plancha');
    expect(persistenceDto.brand).toBe('Casero');
    expect(persistenceDto.servingSize).toBe('150g');
    expect(persistenceDto.calories).toBe(180);
    expect(persistenceDto.proteinGrams).toBe(35.5);
    expect(persistenceDto.carbGrams).toBe(0);
    expect(persistenceDto.fatGrams).toBe(4.2);
    expect(persistenceDto.isPublic).toBe(true);

    // No debe contener propiedades no permitidas que el backend rechaza
    expect(persistenceDto).not.toHaveProperty('name');
    expect(persistenceDto).not.toHaveProperty('servingUnit');
    expect(persistenceDto).not.toHaveProperty('carbsGrams');
    expect(persistenceDto).not.toHaveProperty('fatsGrams');
    expect(persistenceDto).not.toHaveProperty('category');

    // Categoría no está en el esquema de la base de datos y no se serializa
    expect(persistenceDto.additionalNutrientsJson).toBe('{}');
  });

  it('debe mapear y persistir iconOrImageUrl soportando URLs de imágenes y emojis', () => {
    // Caso 1: Con URL de imagen
    const rawWithUrl = {
      id: 'food-img-1',
      title: 'Manzana Gala',
      calories: 52,
      iconOrImageUrl: 'https://images.unsplash.com/photo-apple.jpg'
    };
    const domainWithUrl = FoodItemMapper.toDomain(rawWithUrl);
    expect(domainWithUrl.iconOrImageUrl).toBe('https://images.unsplash.com/photo-apple.jpg');

    const persistenceWithUrl = FoodItemMapper.toPersistenceDto(domainWithUrl);
    expect(persistenceWithUrl.iconOrImageUrl).toBe('https://images.unsplash.com/photo-apple.jpg');

    // Caso 2: Con Emoji
    const rawWithEmoji = {
      id: 'food-emoji-1',
      title: 'Huevo Cocido',
      calories: 78,
      iconOrImageUrl: '🥚'
    };
    const domainWithEmoji = FoodItemMapper.toDomain(rawWithEmoji);
    expect(domainWithEmoji.iconOrImageUrl).toBe('🥚');

    // Caso 3: Vacío
    const rawEmpty = {
      id: 'food-empty-1',
      title: 'Brócoli al vapor',
      calories: 35
    };
    const domainEmpty = FoodItemMapper.toDomain(rawEmpty);
    expect(domainEmpty.iconOrImageUrl).toBeUndefined();
    const persistenceEmpty = FoodItemMapper.toPersistenceDto(domainEmpty);
    expect(persistenceEmpty.iconOrImageUrl).toBeUndefined();
  });
});

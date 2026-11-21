import { describe, it, expect } from 'vitest';
import { RecipeMapper } from './RecipeMapper';

describe('RecipeMapper', () => {
  it('debe mapear una receta en formato estándar', () => {
    const raw = {
      id: 'rec-1',
      title: 'Tortilla de Espinaca',
      description: 'Saludable y rápida',
      servings: 2,
      ingredients: [
        { name: 'Huevo', amount: 3, unit: 'unidades' },
        { name: 'Espinaca', amount: 150, unit: 'g' }
      ],
      instructions: ['Batir huevos', 'Cocinar a fuego medio'],
      macros: {
        caloriesPerServing: 210,
        proteinGrams: 18,
        carbsGrams: 3,
        fatsGrams: 14
      },
      permissions: {
        isPublic: true,
        sharedWithUserIds: []
      }
    };

    const domain = RecipeMapper.toDomain(raw);
    expect(domain.id).toBe('rec-1');
    expect(domain.title).toBe('Tortilla de Espinaca');
    expect(domain.ingredients).toHaveLength(2);
    expect(domain.macros.caloriesPerServing).toBe(210);
    expect(domain.permissions.isPublic).toBe(true);
  });

  it('debe mapear receta real de Cloud Run con envelope, totalCalories y ingredientsJson serializado', () => {
    const cloudRunEnvelope = {
      success: true,
      statusCode: 200,
      data: [
        {
          id: 'rec-cr-1',
          title: 'Batido Proteico Matutino',
          description: 'Desayuno post-entreno',
          totalCalories: 350,
          totalProteinGrams: 32,
          totalCarbGrams: 40,
          totalFatGrams: 6,
          ingredientsJson: JSON.stringify([
            { name: 'Proteína Whey', amount: 30, unit: 'g' },
            { name: 'Plátano', amount: 1, unit: 'unidad' }
          ]),
          isPublic: true,
          ownerUserId: 'user-cloud-1'
        }
      ]
    };

    const list = RecipeMapper.toDomainList(cloudRunEnvelope);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('rec-cr-1');
    expect(list[0].title).toBe('Batido Proteico Matutino');
    expect(list[0].macros.caloriesPerServing).toBe(350);
    expect(list[0].macros.proteinGrams).toBe(32);
    expect(list[0].macros.carbsGrams).toBe(40);
    expect(list[0].macros.fatsGrams).toBe(6);
    expect(list[0].ingredients).toHaveLength(2);
    expect(list[0].ingredients[0].name).toBe('Proteína Whey');
    expect(list[0].authorId).toBe('user-cloud-1');
    expect(list[0].permissions.isPublic).toBe(true);
  });

  it('debe mapear correctamente ingredientes guardados con foodItemTitle y quantityText', () => {
    const raw = {
      id: 'rec-cr-2',
      title: 'Tortilla 2 Huevos',
      ingredientsJson: JSON.stringify([
        { foodItemTitle: 'Huevo', quantityText: '2 unidades' },
        { foodItemTitle: 'Tomate', quantityText: '100g' }
      ])
    };

    const domain = RecipeMapper.toDomain(raw);
    expect(domain.ingredients).toHaveLength(2);
    expect(domain.ingredients[0].name).toBe('Huevo');
    expect(domain.ingredients[0].amount).toBe(2);
    expect(domain.ingredients[0].unit).toBe('unidades');
    expect(domain.ingredients[1].name).toBe('Tomate');
    expect(domain.ingredients[1].amount).toBe(100);
    expect(domain.ingredients[1].unit).toBe('g');
  });

  it('debe transformar una receta a DTO de persistencia cumpliendo el esquema inmutable de [recipes]', () => {
    const domainRecipe = {
      title: 'Tortilla de Verduras',
      description: 'Cena ligera',
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      ingredients: [{ name: 'Huevo', amount: 2, unit: 'unidades' }],
      instructions: ['Mezclar', 'Cocinar'],
      macros: {
        caloriesPerServing: 180,
        proteinGrams: 14,
        carbsGrams: 2,
        fatsGrams: 12
      },
      permissions: { isPublic: true, sharedWithUserIds: [] },
      tags: ['Cena', 'Rápida']
    };

    const persistenceDto = RecipeMapper.toPersistenceDto(domainRecipe);

    expect(persistenceDto.title).toBe('Tortilla de Verduras');
    expect(persistenceDto.description).toBe('Cena ligera');
    expect(persistenceDto.totalCalories).toBe(180);
    expect(persistenceDto.totalProteinGrams).toBe(14);
    expect(persistenceDto.totalFatGrams).toBe(12);
    expect(persistenceDto.totalCarbGrams).toBe(2);
    expect(persistenceDto.isPublic).toBe(true);

    // No debe contener campos prohibidos en la raíz
    expect(persistenceDto).not.toHaveProperty('servings');
    expect(persistenceDto).not.toHaveProperty('prepTimeMinutes');
    expect(persistenceDto).not.toHaveProperty('cookTimeMinutes');

    // Deben estar serializados en additionalNutrientsJson
    expect(persistenceDto.additionalNutrientsJson).toBeDefined();
    const extra = JSON.parse(persistenceDto.additionalNutrientsJson as string);
    expect(extra.servings).toBe(2);
    expect(extra.prepTimeMinutes).toBe(10);
    expect(extra.cookTimeMinutes).toBe(15);
    expect(extra.instructions).toEqual(['Mezclar', 'Cocinar']);
    expect(extra.tags).toEqual(['Cena', 'Rápida']);
  });
});

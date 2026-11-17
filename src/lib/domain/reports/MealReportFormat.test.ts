import { describe, it, expect } from 'vitest';
import {
  generateMealReportMarkdown,
  parseMealReportMarkdown,
  formatReportTimestamp,
  parseReportTimestamp,
  type MealBreakdownItem
} from './MealReportFormat';

describe('MealReportFormat', () => {
  const sampleItems: MealBreakdownItem[] = [
    {
      name: 'Huevo',
      brand: 'General Promedio',
      amount: 112,
      unit: 'g',
      calories: 162,
      proteinGrams: 14,
      fatsGrams: 11,
      carbsGrams: 0
    },
    {
      name: 'Palitos de Queso precocidos',
      brand: 'Tu Casa Snacks',
      amount: 35,
      unit: 'g',
      calories: 122,
      proteinGrams: 5,
      fatsGrams: 7,
      carbsGrams: 6
    },
    {
      name: 'Papas Fritas Sabor A Limón',
      brand: 'Kythos',
      amount: 45,
      unit: 'g',
      calories: 193,
      proteinGrams: 2,
      fatsGrams: 12,
      carbsGrams: 18
    }
  ];

  it('debe generar markdown con la estructura y encabezados exactos', () => {
    const md = generateMealReportMarkdown({
      title: 'comida',
      items: sampleItems,
      calculatedMacros: {
        calories: 477,
        proteinGrams: 21,
        fatsGrams: 30,
        carbsGrams: 24
      }
    });

    expect(md).toContain('### 🥗 NOMBRE DEL ALIMENTO\ncomida');
    expect(md).toContain('### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA');
    expect(md).toContain('- **Proteínas:** 21 g');
    expect(md).toContain('- **Grasas:** 30 g');
    expect(md).toContain('- **Carbohidratos:** 24 g');
    expect(md).toContain('- **Calorías Totales:** 477 Kcal');
    expect(md).toContain('### 💡 EVALUACIÓN Y RECOMENDACIONES');
    expect(md).toContain('NOMBRE DEL PLATO REGISTRADO: comida');
    expect(md).toContain('DESGLOSE DE ELEMENTOS CONSUMIDOS EN EL PLATO:');
    expect(md).toContain(
      '1. Huevo (General Promedio) - Cantidad consumida: 112g (Aporte: 162 Kcal, P: 14g, G: 11g, C: 0g)'
    );
    expect(md).toContain(
      '2. Palitos de Queso precocidos (Tu Casa Snacks) - Cantidad consumida: 35g (Aporte: 122 Kcal, P: 5g, G: 7g, C: 6g)'
    );
    expect(md).toContain(
      '3. Papas Fritas Sabor A Limón (Kythos) - Cantidad consumida: 45g (Aporte: 193 Kcal, P: 2g, G: 12g, C: 18g)'
    );
  });

  it('debe parsear un markdown con la estructura esperada por el usuario', () => {
    const userPromptMarkdown = `### 🥗 NOMBRE DEL ALIMENTO
comida

---

### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA
- **Proteínas:** 46 g
- **Grasas:** 37 g
- **Carbohidratos:** 42 g
- **Calorías Totales:** 692 Kcal

---

### 💡 EVALUACIÓN Y RECOMENDACIONES
NOMBRE DEL PLATO REGISTRADO: comida

RESUMEN DE MACRONUTRIENTES Y CALORÍAS CALCULADAS:
- Calorías Totales: 692 Kcal
- Proteínas Totales: 46 g
- Grasas Totales: 37 g
- Carbohidratos Totales: 42 g

DESGLOSE DE ELEMENTOS CONSUMIDOS EN EL PLATO:
1. Huevo (General Promedio) - Cantidad consumida: 112g (Aporte: 162 Kcal, P: 14g, G: 11g, C: 0g)
2. Palitos de Queso precocidos (Tu Casa Snacks) - Cantidad consumida: 35g (Aporte: 122 Kcal, P: 5g, G: 7g, C: 6g)
3. Tomate chonto (General Promedio) - Cantidad consumida: 29g (Aporte: 5 Kcal, P: 0g, G: 0g, C: 1g)
4. Proteína Classic Isolada (Bi-Pro) - Cantidad consumida: 22g (Aporte: 78 Kcal, P: 16g, G: 0g, C: 1g)
5. Papas Fritas Sabor A Limón (Kythos) - Cantidad consumida: 45g (Aporte: 193 Kcal, P: 2g, G: 12g, C: 18g)
6. Tocineta De Pavo (Delipavo) - Cantidad consumida: 11g (Aporte: 23 Kcal, P: 1g, G: 1g, C: 1g)
7. Benditos pop - pandeyucas (Del Origen) - Cantidad consumida: 44g (Aporte: 98 Kcal, P: 5g, G: 3g, C: 11g)
8. Cebolla Blanca (General Promedio) - Cantidad consumida: 20g (Aporte: 8 Kcal, P: 0g, G: 0g, C: 1g)`;

    const parsed = parseMealReportMarkdown(userPromptMarkdown);
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe('comida');
    expect(parsed?.macros.calories).toBe(692);
    expect(parsed?.macros.proteinGrams).toBe(46);
    expect(parsed?.macros.fatsGrams).toBe(37);
    expect(parsed?.macros.carbsGrams).toBe(42);

    expect(parsed?.items.length).toBe(8);
    expect(parsed?.items[0]).toEqual({
      name: 'Huevo',
      brand: 'General Promedio',
      amount: 112,
      unit: 'g',
      calories: 162,
      proteinGrams: 14,
      fatsGrams: 11,
      carbsGrams: 0
    });
    expect(parsed?.items[1]).toEqual({
      name: 'Palitos de Queso precocidos',
      brand: 'Tu Casa Snacks',
      amount: 35,
      unit: 'g',
      calories: 122,
      proteinGrams: 5,
      fatsGrams: 7,
      carbsGrams: 6
    });
    expect(parsed?.items[4].name).toBe('Papas Fritas Sabor A Limón');
    expect(parsed?.items[4].brand).toBe('Kythos');
    expect(parsed?.items[4].amount).toBe(45);
    expect(parsed?.items[4].calories).toBe(193);
  });

  it('debe formatear y parsear timestamps de Firestore DD/MM/YYYY HH:mm', () => {
    const formatted = formatReportTimestamp('2026-11-01', '09:40');
    expect(formatted).toBe('01/11/2026 09:40');

    const parsed = parseReportTimestamp('01/11/2026 09:40');
    expect(parsed.date).toBe('2026-11-01');
    expect(parsed.time).toBe('09:40');
  });

  it('debe parsear timestamps en formato ISO si vienen del backend', () => {
    const parsed = parseReportTimestamp('2026-11-15T14:30:00.000Z');
    expect(parsed.date).toBe('2026-11-15');
    expect(parsed.time).toBe('14:30');
  });

  it('debe parsear timestamps como objeto de Firestore { seconds } o epoch numérico', () => {
    const firestoreObj = { seconds: 1794599946, nanoseconds: 0 };
    const parsedObj = parseReportTimestamp(firestoreObj);
    expect(parsedObj.date).toBeDefined();
    expect(parsedObj.time).toMatch(/^\d{2}:\d{2}$/);

    const epochNum = 1794599946000;
    const parsedNum = parseReportTimestamp(epochNum);
    expect(parsedNum.date).toBeDefined();
    expect(parsedNum.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('debe parsear títulos en la misma línea como "### 🥗 NOMBRE DEL ALIMENTO Desayuno -"', () => {
    const md = `### 🥗 NOMBRE DEL ALIMENTO Desayuno -
---
### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA
- **Proteínas:** 20 g
- **Grasas:** 10 g
- **Carbohidratos:** 30 g
- **Calorías Totales:** 300 Kcal
DESGLOSE DE ELEMENTOS CONSUMIDOS EN EL PLATO:
1. Huevo (General) - Cantidad consumida: 100g (Aporte: 150 Kcal, P: 13g, G: 10g, C: 1g)`;

    const parsed = parseMealReportMarkdown(md);
    expect(parsed?.title).toBe('Desayuno');
    expect(parsed?.items.length).toBe(1);
  });

  it('debe sintetizar un ítem unificado si el markdown solo contiene el resumen nutricional del plato', () => {
    const md = `### 🥗 NOMBRE DEL ALIMENTO
almuerzo

---

### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA
- **Proteínas:** 50 g
- **Grasas:** 16 g
- **Carbohidratos:** 16 g
- **Calorías Totales:** 416 Kcal`;

    const parsed = parseMealReportMarkdown(md);
    expect(parsed?.title).toBe('almuerzo');
    expect(parsed?.macros.calories).toBe(416);
    expect(parsed?.items.length).toBe(1);
    expect(parsed?.items[0]).toEqual({
      name: 'almuerzo',
      brand: 'Plato registrado',
      amount: 1,
      unit: 'porción',
      calories: 416,
      proteinGrams: 50,
      fatsGrams: 16,
      carbsGrams: 16
    });
  });
});

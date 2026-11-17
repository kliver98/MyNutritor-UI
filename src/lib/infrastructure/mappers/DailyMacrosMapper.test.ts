import { describe, it, expect } from 'vitest';
import { DailyMacrosMapper, ReportsMapper, UserSettingsMapper } from './DailyMacrosMapper';

describe('DailyMacrosMapper', () => {
  it('debe mapear correctamente un DTO de macros con snake_case a la entidad de dominio', () => {
    const rawDto = {
      date: '2026-11-15',
      user_id: 'usr_789',
      calories: 2150,
      protein_grams: 165,
      carbs_grams: 210,
      fats_grams: 62,
      target_calories: 2200,
      target_protein_grams: 160
    };

    const domain = DailyMacrosMapper.toDomain(rawDto);

    expect(domain.date).toBe('2026-11-15');
    expect(domain.userId).toBe('usr_789');
    expect(domain.calories).toBe(2150);
    expect(domain.proteinGrams).toBe(165);
    expect(domain.carbsGrams).toBe(210);
    expect(domain.fatsGrams).toBe(62);
    expect(domain.targetCalories).toBe(2200);
    expect(domain.targetProteinGrams).toBe(160);
  });

  it('debe mapear listas de macros vacías o pobladas sin error', () => {
    expect(DailyMacrosMapper.toDomainList(null)).toEqual([]);
    expect(DailyMacrosMapper.toDomainList('invalido')).toEqual([]);

    const list = DailyMacrosMapper.toDomainList([
      { date: '2026-11-14', calories: 2000, protein: 150, carbs: 200, fats: 60 }
    ]);

    expect(list).toHaveLength(1);
    expect(list[0].calories).toBe(2000);
    expect(list[0].proteinGrams).toBe(150);
  });

  it('debe transformar la entidad DailyMacro al DTO estricto de [users/{username}/daily_macros]', () => {
    const domainMacro = {
      date: '2026-11-15',
      calories: 1950,
      targetCalories: 2200,
      proteinGrams: 145,
      carbsGrams: 200,
      fatsGrams: 55
    };

    const persistenceDto = DailyMacrosMapper.toPersistenceDto(domainMacro, '2026-11-15');

    expect(persistenceDto.id).toBe('2026-11-15');
    expect(persistenceDto.dateStr).toBe('2026-11-15');
    expect(persistenceDto.consumedCalories).toBe(1950);
    expect(persistenceDto.targetCalories).toBe(2200);
    expect(persistenceDto.proteinGrams).toBe(145);
    expect(persistenceDto.fatGrams).toBe(55);
    expect(persistenceDto.carbGrams).toBe(200);

    // No debe contener propiedades no permitidas por el backend
    expect(persistenceDto).not.toHaveProperty('calories');
    expect(persistenceDto).not.toHaveProperty('fatsGrams');
    expect(persistenceDto).not.toHaveProperty('carbsGrams');
  });
});

describe('ReportsMapper & UserSettingsMapper', () => {
  it('debe mapear reportes y valores promedio', () => {
    const rawReport = {
      id: 'rep_1',
      user_id: 'usr_1',
      title: 'Reporte Mensual',
      summary: {
        average_calories: 2050,
        average_protein: 155,
        average_carbs: 210,
        average_fats: 65
      }
    };

    const report = ReportsMapper.toDomain(rawReport);
    expect(report.id).toBe('rep_1');
    expect(report.summary.averageCalories).toBe(2050);
    expect(report.summary.averageProtein).toBe(155);
  });

  it('debe mapear reportes de Firestore con fullContent Markdown y timestamp DD/MM/YYYY HH:mm', () => {
    const rawFirestoreDoc = {
      id: '04055f6d-f201-4491-b60b-2d480414cc4d',
      title: 'Desayuno ',
      timestamp: '01/11/2026 09:40',
      fullContent: `### 🥗 NOMBRE DEL ALIMENTO
Desayuno

---

### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA
- **Proteínas:** 46 g
- **Grasas:** 37 g
- **Carbohidratos:** 42 g
- **Calorías Totales:** 692 Kcal

---

### 💡 EVALUACIÓN Y RECOMENDACIONES
NOMBRE DEL PLATO REGISTRADO: Desayuno

RESUMEN DE MACRONUTRIENTES Y CALORÍAS CALCULADAS:
- Calorías Totales: 692 Kcal
- Proteínas Totales: 46 g
- Grasas Totales: 37 g
- Carbohidratos Totales: 42 g

DESGLOSE DE ELEMENTOS CONSUMIDOS EN EL PLATO:
1. Huevo (General Promedio) - Cantidad consumida: 112g (Aporte: 162 Kcal, P: 14g, G: 11g, C: 0g)
2. Palitos de Queso precocidos (Tu Casa Snacks) - Cantidad consumida: 35g (Aporte: 122 Kcal, P: 5g, G: 7g, C: 6g)`
    };

    const domain = ReportsMapper.toDomain(rawFirestoreDoc);
    expect(domain.id).toBe('04055f6d-f201-4491-b60b-2d480414cc4d');
    expect(domain.title).toBe('Desayuno ');
    expect(domain.periodStart).toBe('2026-11-01');
    expect(domain.summary.averageCalories).toBe(692);
    expect(domain.summary.averageProtein).toBe(46);
    expect(domain.summary.averageFats).toBe(37);
    expect(domain.summary.averageCarbs).toBe(42);
    expect(domain.items?.length).toBe(2);
    expect(domain.items?.[0].name).toBe('Huevo');
    expect(domain.items?.[1].name).toBe('Palitos de Queso precocidos');
  });

  it('debe transformar Reporte a persistencia cumpliendo el esquema inmutable de reports', () => {
    const domainReport = {
      id: 'rep_123',
      title: 'Reporte Semanal',
      periodStart: '2026-11-08',
      periodEnd: '2026-11-15',
      summary: {
        averageCalories: 2100,
        averageProtein: 150,
        averageCarbs: 220,
        averageFats: 60
      }
    };

    const persistence = ReportsMapper.toPersistenceDto(domainReport, 'usr_test');
    expect(persistence.id).toBe('rep_123');
    expect(persistence.title).toBe('Reporte Semanal');
    expect(persistence.userId).toBe('usr_test');
    expect(persistence.timestamp).toBeDefined();
    expect(typeof persistence.fullContent).toBe('string');

    // No debe contener propiedades directas fuera de los allowed fields
    expect(persistence).not.toHaveProperty('periodStart');
    expect(persistence).not.toHaveProperty('periodEnd');
    expect(persistence).not.toHaveProperty('summary');
  });

  it('debe mapear ajustes de usuario y preferencias de tema', () => {
    const rawSettings = {
      user_id: 'usr_1',
      theme_preference: 'dark',
      measurement_unit: 'metric',
      daily_calorie_goal: 2300,
      notifications_enabled: true
    };

    const settings = UserSettingsMapper.toSettingsDomain(rawSettings);
    expect(settings.themePreference).toBe('dark');
    expect(settings.measurementUnit).toBe('metric');
    expect(settings.dailyCalorieGoal).toBe(2300);
  });

  it('debe mapear el esquema de Firestore config con customBackgroundColor y themeMode', () => {
    // Documento exacto de Firestore users/{username}/user_settings/config
    const firestoreConfig = {
      id: 'config',
      themeMode: 'LIGHT',
      customBackgroundColor: -14651472,
      customColorPresets: [-14651472, -1],
      selectedModel: 'gemini-3.7-flash',
      geminiApiKey: 'AQ.Ab8RN6L12FLAaN4OBvSgfDpSsMxxvRN...',
      lastUpdated: 1794599946571
    };

    const settings = UserSettingsMapper.toSettingsDomain(firestoreConfig);
    expect(settings.themePreference).toBe('light');
    expect(settings.customBackgroundColor).toBe('#206fb0');
    expect(settings.customBackgroundColorRaw).toBe(-14651472);
    expect(settings.customColorPresets).toEqual(['#206fb0', '#ffffff']);

    // Persistencia inversa
    const persistenceDto = UserSettingsMapper.toPersistenceDto({
      themePreference: 'light',
      customBackgroundColor: '#206fb0'
    });
    expect(persistenceDto.themeMode).toBe('LIGHT');
    expect(persistenceDto.customBackgroundColor).toBe(-14651472);
  });
});

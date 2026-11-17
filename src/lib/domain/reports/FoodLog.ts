import type { MealBreakdownItem } from './MealReportFormat';

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (hora de registro secundaria)
  title: string; // Título o nombre del alimento
  amount: number | string; // Cantidad registrada
  unit: string; // Unidad de medida (g, ml, porción, etc.)
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  rawMarkdown?: string;
  items?: MealBreakdownItem[];
}

export interface DayFoodLogGroup {
  date: string;
  displayDate: string;
  items: FoodLogItem[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatsGrams: number;
}

export type FoodLogDateRangePreset = '7' | '14' | 'custom';

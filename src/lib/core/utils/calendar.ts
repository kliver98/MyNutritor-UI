/**
 * calendar.ts
 *
 * Utilidades para cálculo de calendarios de rango interactivo tipo Booking / Aerolíneas.
 */

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
}

export const SPANISH_MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

export const SPANISH_WEEKDAY_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/**
 * Convierte año, mes (0-11) y día en string 'YYYY-MM-DD'
 */
export function toDateString(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parsea un string 'YYYY-MM-DD' a { year, month (0-11), day }
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      day: parseInt(parts[2], 10)
    };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

/**
 * Retorna el mes siguiente dado año y mes (0-11)
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
}

/**
 * Retorna el mes anterior dado año y mes (0-11)
 */
export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
}

/**
 * Genera la cuadrícula de días para un mes dado.
 * Lunes es el primer día de la semana (índice 0) y Domingo el último (índice 6).
 */
export function getMonthCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  // En JS: 0=Domingo, 1=Lunes... Para que Lunes sea 0: (day + 6) % 7
  const startDayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Días previos del mes anterior para rellenar la primera semana
  const prevMonth = getPrevMonth(year, month);
  const prevMonthTotalDays = new Date(prevMonth.year, prevMonth.month + 1, 0).getDate();
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    days.push({
      dateStr: toDateString(prevMonth.year, prevMonth.month, dayNum),
      dayNumber: dayNum,
      isCurrentMonth: false
    });
  }

  // Días del mes actual
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    days.push({
      dateStr: toDateString(year, month, dayNum),
      dayNumber: dayNum,
      isCurrentMonth: true
    });
  }

  // Días posteriores del mes siguiente para completar múltiplos de 7 (mínimo 35 o 42 celdas)
  const remaining = (7 - (days.length % 7)) % 7;
  const nextMonth = getNextMonth(year, month);
  for (let dayNum = 1; dayNum <= remaining; dayNum++) {
    days.push({
      dateStr: toDateString(nextMonth.year, nextMonth.month, dayNum),
      dayNumber: dayNum,
      isCurrentMonth: false
    });
  }

  return days;
}

/**
 * Calcula la diferencia en días naturales entre dos fechas YYYY-MM-DD (inclusive inicio y fin).
 */
export function getDaysDifference(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  const diffMs = date2.getTime() - date1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Retorna la fecha de inicio YYYY-MM-DD para que un rango que termina en endDate
 * contenga exactamente totalDays días naturales (inclusive).
 */
export function getPresetStartDate(endDateStr: string, totalDays: number): string {
  if (!endDateStr) return '';
  const [y, m, d] = endDateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);
  const daysToSubtract = Math.max(0, totalDays - 1);
  baseDate.setDate(baseDate.getDate() - daysToSubtract);
  return toDateString(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
}

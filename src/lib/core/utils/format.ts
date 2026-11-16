/**
 * format.ts
 *
 * Utilidades para formateo consistente y redondeo de números y macros
 * en toda la aplicación (máximo 2 decimales sin ceros redundantes).
 */

/**
 * Redondea un valor numérico a un máximo de decimales (por defecto 2).
 * Elimina artefactos de punto flotante de JavaScript (ej. 9.300000019 -> 9.3).
 */
export function roundToDecimals(
  val: number | string | undefined | null,
  maxDecimals: number = 2
): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, maxDecimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Formatea un valor numérico como string redondeado a máximo 2 decimales.
 * Ejemplos:
 * 9.300000019 -> "9.3"
 * 9.356 -> "9.36"
 * 10 -> "10"
 * 0 -> "0"
 */
export function formatNumber(
  val: number | string | undefined | null,
  maxDecimals: number = 2
): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = roundToDecimals(val, maxDecimals);
  // Usa Number.prototype.toString para no forzar ceros decimales innecesarios (ej. 9.3 en vez de 9.30)
  return num.toString();
}

/**
 * Formatea un gramaje o macro agregando la unidad 'g'
 */
export function formatGrams(
  val: number | string | undefined | null,
  maxDecimals: number = 2
): string {
  return `${formatNumber(val, maxDecimals)}g`;
}

/**
 * Formatea calorías agregando la unidad 'kcal'
 */
export function formatCalories(val: number | string | undefined | null): string {
  return `${formatNumber(val, 0)} kcal`;
}

/**
 * Obtiene la fecha local en formato 'YYYY-MM-DD' usando la hora y zona horaria local del usuario.
 * Evita el desfase de toISOString() que convierte a UTC y se adelanta un día en horas de la tarde/noche.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de ayer en formato local 'YYYY-MM-DD'.
 */
export function getYesterdayDateStr(baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - 1);
  return getLocalDateStr(d);
}

/**
 * Obtiene una fecha de hace N días en formato local 'YYYY-MM-DD'.
 */
export function getPastDateStr(daysAgo: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateStr(d);
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/YYYY
 */
export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formatea una fecha YYYY-MM-DD a 'DD Mes' para gráficos (ej. '15 Nov')
 */
export function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]}`;
    }
    return `${day}/${parts[1]}`;
  }
  return dateStr;
}

/**
 * Convierte un color de la API (entero firmado ARGB de 32 bits de Firestore/Android, ej. -14651472,
 * o string hex/rgb) en una representación CSS válida (ej. #206fb0).
 */
export function parseColorToCss(color: unknown): string | undefined {
  if (color === null || color === undefined || color === '') return undefined;

  if (typeof color === 'number') {
    if (color === 0) return undefined;
    const unsigned = color >>> 0;
    const a = (unsigned >>> 24) & 0xff;
    const r = (unsigned >>> 16) & 0xff;
    const g = (unsigned >>> 8) & 0xff;
    const b = unsigned & 0xff;

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    if (a === 255 || a === 0) {
      return `#${rHex}${gHex}${bHex}`;
    }
    const aHex = a.toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }

  if (typeof color === 'string') {
    const trimmed = color.trim();
    if (!trimmed) return undefined;

    const asNum = Number(trimmed);
    if (!isNaN(asNum) && (trimmed.startsWith('-') || /^\d+$/.test(trimmed))) {
      return parseColorToCss(asNum);
    }

    if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
      return trimmed;
    }

    if (/^[0-9a-fA-F]{6}$/.test(trimmed) || /^[0-9a-fA-F]{8}$/.test(trimmed)) {
      return `#${trimmed}`;
    }
  }

  return undefined;
}

/**
 * Convierte un color CSS hex a un entero firmado de 32 bits ARGB para persistencia en Firestore
 */
export function cssColorToArgbInt(cssColor: string): number | null {
  if (!cssColor) return null;
  const hex = cssColor.trim().replace(/^#/, '');

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (255 << 24) | (r << 16) | (g << 8) | b;
  }

  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16);
    return (a << 24) | (r << 16) | (g << 8) | b;
  }

  return null;
}

/**
 * Determina si un color CSS tiene luminancia oscura (WCAG) para garantizar contraste visual
 */
export function isColorDark(cssColor: string | undefined | null): boolean {
  if (!cssColor) return false;
  const hex = cssColor.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
  }
  return false;
}

/**
 * mapper-utils.ts
 *
 * Utilidades para normalizar y desenvolver respuestas de la API backend que
 * utilizan el formato estándar de envelope:
 * { success: boolean, statusCode?: number, data?: T, message?: string }
 */

export function unwrapData<T = unknown>(raw: unknown): T {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'data' in raw &&
    (raw as { data: unknown }).data !== undefined &&
    (raw as { data: unknown }).data !== null
  ) {
    const candidate = raw as { data: T; success?: boolean; statusCode?: number };
    // Si contiene la clave data acompañada de success o statusCode, es un envelope
    if ('success' in candidate || 'statusCode' in candidate) {
      return candidate.data;
    }
  }
  return raw as T;
}

export function unwrapList<T = unknown>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  // Envelope estándar { success: true, data: [...] | { ... } }
  if ('data' in raw) {
    const candidate = (raw as { data: unknown }).data;
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
    if (candidate && typeof candidate === 'object') {
      const vals = Object.values(candidate);
      if (vals.length > 0 && typeof vals[0] === 'object' && vals[0] !== null) {
        return vals as T[];
      }
    }
  }

  // Claves comunes para listas envueltas
  for (const key of ['reports', 'items', 'results', 'records', 'foodItems', 'recipes']) {
    if (key in raw && Array.isArray((raw as Record<string, unknown>)[key])) {
      return (raw as Record<string, unknown>)[key] as T[];
    }
  }

  // Objeto cuyas claves son IDs y valores son los objetos
  const values = Object.values(raw);
  if (
    values.length > 0 &&
    typeof values[0] === 'object' &&
    values[0] !== null &&
    !('success' in raw)
  ) {
    return values as T[];
  }

  return [];
}

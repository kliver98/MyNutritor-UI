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
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'data' in raw &&
    Array.isArray((raw as { data: unknown }).data)
  ) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

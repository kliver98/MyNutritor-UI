import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { macrosStore } from './macros.store';
import { authStore } from '../auth/auth.store';
import { repositories } from '../../infrastructure/container';

describe('macros.store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authStore.setDemoSession('user');
  });

  it('debe cambiar la fecha seleccionada y cargar los datos', async () => {
    vi.spyOn(repositories.dailyMacros, 'getByDate').mockResolvedValueOnce({
      date: '2026-11-20',
      userId: 'usr_1',
      calories: 1950,
      proteinGrams: 140,
      carbsGrams: 200,
      fatsGrams: 60
    });

    macrosStore.setDate('2026-11-20');
    expect(get(macrosStore).selectedDate).toBe('2026-11-20');

    await vi.waitFor(() => {
      expect(get(macrosStore).currentMacro?.calories).toBe(1950);
    });
  });

  it('debe realizar actualización optimista al guardar macros', async () => {
    vi.spyOn(repositories.dailyMacros, 'create').mockResolvedValueOnce({
      date: '2026-11-15',
      userId: 'usr_1',
      calories: 2200,
      proteinGrams: 160,
      carbsGrams: 220,
      fatsGrams: 70
    });

    const promise = macrosStore.saveMacro('2026-11-15', { calories: 2200 });
    // Inmediatamente refleja el valor optimista
    expect(get(macrosStore).currentMacro?.calories).toBe(2200);

    const result = await promise;
    expect(result).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { foodsStore } from './foods.store';

describe('foodsStore', () => {
  beforeEach(() => {
    foodsStore.reset();
  });

  it('debe inicializarse con el estado correcto sin categorías', () => {
    const state = get(foodsStore);
    expect(state.items).toEqual([]);
    expect(state.excludedIds).toEqual([]);
    expect(state.searchQuery).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('debe actualizar el searchQuery mediante setSearch', () => {
    foodsStore.setSearch('aguacate');
    expect(get(foodsStore).searchQuery).toBe('aguacate');
  });

  it('debe resetear el estado correctamente al llamar a reset', () => {
    foodsStore.setSearch('pollo');
    expect(get(foodsStore).searchQuery).toBe('pollo');

    foodsStore.reset();
    const state = get(foodsStore);
    expect(state.searchQuery).toBe('');
    expect(state.items).toEqual([]);
    expect(state.excludedIds).toEqual([]);
  });
});

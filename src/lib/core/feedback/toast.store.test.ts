import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { toastStore } from './toast.store';

describe('toast.store', () => {
  beforeEach(() => {
    toastStore.clear();
  });

  it('debe agregar un toast con mensaje y tipo adecuado', () => {
    toastStore.success('Operación completada', 'Éxito');
    const items = get(toastStore);

    expect(items).toHaveLength(1);
    expect(items[0].message).toBe('Operación completada');
    expect(items[0].title).toBe('Éxito');
    expect(items[0].type).toBe('success');
  });

  it('debe permitir remover un toast por su ID', () => {
    const id = toastStore.info('Notificación informativa');
    expect(get(toastStore)).toHaveLength(1);

    toastStore.remove(id);
    expect(get(toastStore)).toHaveLength(0);
  });

  it('debe soportar acciones interactivas tipo Undo', () => {
    const actionSpy = vi.fn();
    toastStore.warning('Elemento borrado', 'Aviso', {
      label: 'Deshacer',
      onClick: actionSpy
    });

    const items = get(toastStore);
    expect(items[0].action).toBeDefined();
    expect(items[0].action?.label).toBe('Deshacer');

    items[0].action?.onClick();
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});

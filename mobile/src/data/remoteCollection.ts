import { apiRequest } from './apiClient';

/**
 * Colección remota con el mismo patrón que los repositorios locales:
 * snapshot en memoria + listeners + hidratación en segundo plano.
 *
 * Permite que las pantallas sigan leyendo de forma síncrona sin cambiar su
 * código, mientras los datos llegan del backend.
 */
export type RemoteCollection<T> = {
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  subscribe: (listener: () => void) => () => void;
  refresh: () => Promise<T[]>;
  isReady: () => boolean;
  setAll: (items: T[]) => void;
};

export function createRemoteCollection<T extends { id: string }>(
  path: string | (() => string),
): RemoteCollection<T> {
  let items: T[] = [];
  let ready = false;
  let inFlight: Promise<T[]> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const setAll = (next: T[]) => {
    items = next;
    ready = true;
    emit();
  };

  const refresh = () => {
    // Una sola petición en vuelo: varias pantallas montan a la vez.
    if (inFlight) return inFlight;

    const resolved = typeof path === 'function' ? path() : path;
    inFlight = apiRequest<T[]>(resolved)
      .then((next) => {
        setAll(next);
        return next;
      })
      .catch(() => {
        ready = true;
        emit();
        return items;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  };

  return {
    getAll: () => items,
    getById: (id: string) => items.find((item) => item.id === id),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (!ready) void refresh();
      return () => {
        listeners.delete(listener);
      };
    },
    refresh,
    isReady: () => ready,
    setAll,
  };
}

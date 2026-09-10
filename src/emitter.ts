import type { BookEventHandler, BookEventMap, BookEventName } from './types';

/** A tiny typed emitter. A throwing handler never stops the others. */
export class Emitter {
  private handlers = new Map<string, Set<(payload: never) => void>>();

  on<K extends BookEventName>(event: K, handler: BookEventHandler<K>): void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as (payload: never) => void);
  }

  off<K extends BookEventName>(event: K, handler: BookEventHandler<K>): void {
    this.handlers.get(event)?.delete(handler as (payload: never) => void);
  }

  emit<K extends BookEventName>(event: K, payload: BookEventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        (handler as BookEventHandler<K>)(payload);
      } catch (error) {
        console.error(`[ZorealBook] listener for "${event}" threw`, error);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

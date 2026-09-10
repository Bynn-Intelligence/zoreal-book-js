import { BookNamespace } from './core';
import { bindAttributes } from './attributes';
import type {
  BookConfig,
  BookEventHandler,
  BookEventName,
  FloatingButtonOptions,
  InitOptions,
  InlineOptions,
  ModalOptions,
  PreloadOptions,
  UiConfig,
} from './types';
import { DEFAULT_NAMESPACE, DEFAULT_ORIGIN, PROTOCOL_VERSION, SDK_VERSION, normaliseOrigin } from './wire';

const namespaces = new Map<string, BookNamespace>();
let defaultOrigin = DEFAULT_ORIGIN;

/**
 * An independent embed on the same page.
 *
 * Two namespaces keep separate frames, appearance and listeners, so a "sales"
 * embed and a "support" embed never cross.
 */
export function ns(name: string): BookNamespace {
  let instance = namespaces.get(name);
  if (!instance) {
    instance = new BookNamespace(name);
    instance.init({ origin: defaultOrigin });
    namespaces.set(name, instance);
  }
  return instance;
}

const root = ns(DEFAULT_NAMESPACE);

let unbindAttributes: (() => void) | null = null;

/** The whole API, on the default namespace unless you ask for another. */
export const ZorealBook = {
  version: SDK_VERSION,
  protocolVersion: PROTOCOL_VERSION,

  /** Points every namespace at a Book origin. Call before anything else. */
  init(options: InitOptions = {}) {
    if (options.origin) {
      defaultOrigin = normaliseOrigin(options.origin);
      for (const instance of namespaces.values()) instance.init({ origin: defaultOrigin });
    }
    if (!unbindAttributes && typeof document !== 'undefined') {
      unbindAttributes = bindAttributes({ ns });
    }
    return ZorealBook;
  },

  ns,

  inline: (options: InlineOptions) => root.inline(options),
  modal: (options: ModalOptions) => root.modal(options),
  floatingButton: (options: FloatingButtonOptions) => root.floatingButton(options),
  preload: (options: PreloadOptions) => root.preload(options),
  redirect: (options: ModalOptions & { target?: '_self' | '_blank' }) => root.redirect(options),
  hostedUrl: (link: string, config?: BookConfig) => root.hostedUrl(link, config),
  ui: (config: UiConfig) => root.ui(config),

  on<K extends BookEventName>(event: K, handler: BookEventHandler<K>) {
    root.on(event, handler);
    return ZorealBook;
  },

  off<K extends BookEventName>(event: K, handler: BookEventHandler<K>) {
    root.off(event, handler);
    return ZorealBook;
  },

  /** Tears down every namespace. Mostly useful in tests. */
  destroy() {
    for (const instance of namespaces.values()) instance.destroy();
    namespaces.clear();
    unbindAttributes?.();
    unbindAttributes = null;
    namespaces.set(DEFAULT_NAMESPACE, root);
  },
};

export { BookNamespace } from './core';
export { bindAttributes } from './attributes';
export { snippet, type SnippetMode, type SnippetOptions } from './snippet';
export {
  DEFAULT_ORIGIN,
  PROTOCOL_VERSION,
  SDK_VERSION,
  isValidLink,
  METADATA_MAX_PAIRS,
} from './wire';
export type * from './types';

export default ZorealBook;

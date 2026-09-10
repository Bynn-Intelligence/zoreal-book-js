import { Emitter } from './emitter';
import { BookFrame } from './frame';
import { createShadowHost } from './shadow';
import { CLOSE_ICON } from './styles';
import type {
  BookConfig,
  BookEventHandler,
  BookEventMap,
  BookEventName,
  FloatingButtonOptions,
  FloatingHandle,
  InlineHandle,
  InlineOptions,
  ModalHandle,
  ModalOptions,
  PreloadOptions,
  UiConfig,
} from './types';
import {
  DEFAULT_ORIGIN,
  INBOUND,
  PUBLIC_EVENTS,
  assertValidLink,
  normaliseOrigin,
  type WireMessage,
} from './wire';

/** Prefill that would put a person's details in a URL, and so never does. */
const PERSONAL_KEYS = ['name', 'email', 'phone', 'guests', 'notes', 'answers'] as const;

/** Prefill that is safe in a URL because it describes the appointment, not the guest. */
const REDIRECT_KEYS = ['month', 'date', 'slot', 'locale', 'timezone'] as const;

function resolveElement(element: HTMLElement | string): HTMLElement {
  if (typeof element !== 'string') return element;
  const found = document.querySelector(element);
  if (!found) throw new Error(`[ZorealBook] No element matches ${JSON.stringify(element)}.`);
  return found as HTMLElement;
}

/**
 * One namespace's API.
 *
 * A namespace is an independent embed: its own frames, its own appearance and
 * its own listeners. Two of them on one page, say a short "sales" call and a
 * long "onboarding" one, never see each other's events.
 */
export class BookNamespace {
  readonly namespace: string;

  private origin = DEFAULT_ORIGIN;
  private uiConfig: UiConfig | undefined;
  private readonly emitter = new Emitter();
  private readonly frames = new Set<BookFrame>();
  private readonly preloaded = new Map<string, BookFrame>();
  /** One inline embed per element: mounting again replaces, it never doubles. */
  private readonly inlines = new Map<Element, () => void>();
  private openModal: (() => void) | null = null;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  /** Points the embed at a Book origin. Defaults to the public one. */
  init(options: { origin?: string } = {}): this {
    if (options.origin) this.origin = normaliseOrigin(options.origin);
    return this;
  }

  /** Appearance for every frame in this namespace, now and later. */
  ui(config: UiConfig): this {
    this.uiConfig = { ...this.uiConfig, ...config };
    for (const frame of this.frames) frame.setUi(this.uiConfig);
    return this;
  }

  on<K extends BookEventName>(event: K, handler: BookEventHandler<K>): this {
    this.emitter.on(event, handler);
    return this;
  }

  off<K extends BookEventName>(event: K, handler: BookEventHandler<K>): this {
    this.emitter.off(event, handler);
    return this;
  }

  private track(frame: BookFrame): void {
    this.frames.add(frame);
  }

  private release(frame: BookFrame): void {
    this.frames.delete(frame);
    frame.destroy();
  }

  /** Turns a frame message into a public event, ignoring the private ones. */
  private publish(message: WireMessage): void {
    if ((PUBLIC_EVENTS as readonly string[]).includes(message.type)) {
      this.emitter.emit(
        message.type as BookEventName,
        message.payload as BookEventMap[BookEventName],
      );
    }
  }

  /**
   * Renders the booking screens where you point them.
   *
   * The wrapper sizes itself to the frame's own content, so the page never
   * shows a scrollbar inside a scrollbar.
   */
  inline(options: InlineOptions): InlineHandle {
    const target = resolveElement(options.element);
    // A page builder or a hot reload that runs the same call twice would
    // otherwise stack two frames in one element; the earlier one goes first.
    this.inlines.get(target)?.();
    const { host, root } = createShadowHost('inline');

    const wrapper = document.createElement('div');
    wrapper.className = 'zb-inline';
    if (this.uiConfig?.theme === 'dark') wrapper.setAttribute('data-theme', 'dark');

    const spinner = document.createElement('div');
    spinner.className = 'zb-spinner';

    const frame = new BookFrame({
      origin: this.origin,
      namespace: this.namespace,
      link: options.link,
      config: options.config,
      ui: this.uiConfig,
      onMessage: (message) => {
        if (message.type === INBOUND.ready) spinner.hidden = true;
        if (message.type === INBOUND.dimension) {
          const height = (message.payload as { height?: number })?.height;
          if (typeof height === 'number' && height > 0) wrapper.style.height = `${height}px`;
        }
        this.publish(message);
      },
    });

    wrapper.appendChild(frame.iframe);
    wrapper.appendChild(spinner);
    root.appendChild(wrapper);
    target.appendChild(host);
    this.track(frame);

    const destroy = () => {
      if (this.inlines.get(target) === destroy) this.inlines.delete(target);
      this.release(frame);
      host.remove();
    };
    this.inlines.set(target, destroy);

    return {
      destroy,
      setConfig: (config: BookConfig) => frame.setConfig(config),
    };
  }

  /** Opens the booking screens in a layer over your page. */
  modal(options: ModalOptions): ModalHandle {
    if (this.openModal) this.openModal();

    const { host, root } = createShadowHost('modal');

    const overlay = document.createElement('div');
    overlay.className = 'zb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Booking');

    const dialog = document.createElement('div');
    dialog.className = 'zb-dialog';
    if (this.uiConfig?.theme === 'dark') dialog.setAttribute('data-theme', 'dark');

    const close = document.createElement('button');
    close.className = 'zb-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close booking');
    close.innerHTML = CLOSE_ICON;

    const spinner = document.createElement('div');
    spinner.className = 'zb-spinner';

    // The frame is as tall as its own content and the dialog scrolls it, so
    // the booking page never scrolls inside the layer: one scrollbar, the
    // dialog's, and none when it fits.
    const body = document.createElement('div');
    body.className = 'zb-body';

    const preloaded = this.preloaded.get(options.link);
    const frame =
      preloaded ??
      new BookFrame({
        origin: this.origin,
        namespace: this.namespace,
        link: options.link,
        config: options.config,
        ui: this.uiConfig,
        onMessage: (message) => handle(message),
      });

    if (preloaded) {
      this.preloaded.delete(options.link);
      if (options.config) preloaded.setConfig(options.config);
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const dismiss = () => {
      if (this.openModal !== dismiss) return;
      this.openModal = null;
      document.removeEventListener('keydown', onKey);
      this.release(frame);
      host.remove();
      previouslyFocused?.focus?.();
    };

    const handle = (message: WireMessage) => {
      if (message.type === INBOUND.ready) spinner.hidden = true;
      if (message.type === INBOUND.dimension) {
        const height = (message.payload as { height?: number })?.height;
        if (typeof height === 'number' && height > 0) frame.iframe.style.height = `${height}px`;
      }
      if (message.type === INBOUND.close) dismiss();
      this.publish(message);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    close.addEventListener('click', dismiss);
    overlay.addEventListener('mousedown', (event) => {
      if (event.target === overlay) dismiss();
    });
    document.addEventListener('keydown', onKey);

    dialog.appendChild(close);
    body.appendChild(frame.iframe);
    dialog.appendChild(body);
    dialog.appendChild(spinner);
    overlay.appendChild(dialog);
    root.appendChild(overlay);
    document.body.appendChild(host);
    this.track(frame);
    this.openModal = dismiss;

    requestAnimationFrame(() => overlay.setAttribute('data-open', 'true'));
    close.focus();

    return {
      close: dismiss,
      setConfig: (config: BookConfig) => frame.setConfig(config),
    };
  }

  /** A button fixed to the corner of the page that opens the modal. */
  floatingButton(options: FloatingButtonOptions): FloatingHandle {
    assertValidLink(options.link);
    const { host, root } = createShadowHost('floating');

    const button = document.createElement('button');
    button.className = 'zb-float';
    button.type = 'button';
    button.textContent = options.text ?? 'Book a time';
    button.setAttribute('data-position', options.position ?? 'bottom-right');
    button.style.background = options.color ?? '#1f2937';
    button.style.color = options.textColor ?? '#ffffff';
    button.addEventListener('click', () => {
      this.modal({ link: options.link, config: options.config });
    });

    root.appendChild(button);
    document.body.appendChild(host);

    return { destroy: () => host.remove() };
  }

  /**
   * Warms a frame before anyone clicks.
   *
   * The next `modal()` for the same link adopts it, so the screens are already
   * painted when the layer opens.
   */
  preload(options: PreloadOptions): void {
    assertValidLink(options.link);
    if (this.preloaded.has(options.link)) return;

    const frame = new BookFrame({
      origin: this.origin,
      namespace: this.namespace,
      link: options.link,
      ui: this.uiConfig,
      onMessage: () => undefined,
    });
    frame.iframe.setAttribute('aria-hidden', 'true');
    frame.iframe.setAttribute('tabindex', '-1');
    frame.iframe.style.position = 'absolute';
    frame.iframe.style.width = '1px';
    frame.iframe.style.height = '1px';
    frame.iframe.style.opacity = '0';
    frame.iframe.style.pointerEvents = 'none';
    frame.iframe.style.left = '-9999px';

    document.body.appendChild(frame.iframe);
    this.preloaded.set(options.link, frame);
  }

  /**
   * Sends the guest to the hosted booking page instead of embedding it.
   *
   * Personal prefill is dropped rather than put in the address, because a name
   * or an email in a URL ends up in server logs, browser history and referrer
   * headers. Pass those through `modal()` or `inline()`, where they travel over
   * the message channel instead.
   */
  redirect(options: ModalOptions & { target?: '_self' | '_blank' }): void {
    const url = this.hostedUrl(options.link, options.config);
    if (options.target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.assign(url);
  }

  /** The address of the hosted booking page for a link. */
  hostedUrl(link: string, config?: BookConfig): string {
    assertValidLink(link);
    const url = new URL(`${this.origin}/${link}`);

    if (config) {
      const dropped = PERSONAL_KEYS.filter((key) => config[key] !== undefined);
      if (dropped.length > 0) {
        console.warn(
          `[ZorealBook] Dropped ${dropped.join(', ')} from the redirect address: personal prefill is never put in a URL. Use inline() or modal() to prefill those.`,
        );
      }
      for (const key of REDIRECT_KEYS) {
        const value = config[key];
        if (typeof value === 'string' && value !== '') url.searchParams.set(key, value);
      }
      if (config.metadata) {
        for (const [key, value] of Object.entries(config.metadata)) {
          url.searchParams.set(`md_${key}`, value);
        }
      }
    }

    return url.toString();
  }

  /** Tears down every frame, listener and layer this namespace owns. */
  destroy(): void {
    if (this.openModal) this.openModal();
    for (const frame of [...this.frames]) this.release(frame);
    for (const frame of this.preloaded.values()) frame.destroy();
    this.preloaded.clear();
    this.emitter.clear();
  }
}

import type { BookConfig, UiConfig } from './types';
import {
  FRAME_SANDBOX,
  INBOUND,
  OUTBOUND,
  PROTOCOL_VERSION,
  assertValidLink,
  assertValidMetadata,
  frameUrl,
  isWireMessage,
  type WireMessage,
} from './wire';

export interface FrameOptions {
  origin: string;
  namespace: string;
  link: string;
  config?: BookConfig;
  ui?: UiConfig;
  /** Every frame-to-page message that passed the origin check. */
  onMessage: (message: WireMessage) => void;
}

/**
 * One booking frame and the channel to it.
 *
 * The frame is opened bare and told everything afterwards. Two checks guard
 * the channel in each direction: the page accepts a message only from the
 * exact origin it opened and only from that frame's own window, and the frame
 * accepts only the origin it was handed when it was created.
 */
export class BookFrame {
  readonly iframe: HTMLIFrameElement;
  readonly namespace: string;
  readonly link: string;

  private readonly origin: string;
  private readonly onMessage: FrameOptions['onMessage'];
  private readonly listener: (event: MessageEvent) => void;

  private config: BookConfig | undefined;
  private ui: UiConfig | undefined;
  private ready = false;
  private destroyed = false;

  constructor(options: FrameOptions) {
    assertValidLink(options.link);
    assertValidMetadata(options.config?.metadata);

    this.origin = options.origin;
    this.namespace = options.namespace;
    this.link = options.link;
    this.config = options.config;
    this.ui = options.ui;
    this.onMessage = options.onMessage;

    const iframe = document.createElement('iframe');
    iframe.src = frameUrl(this.origin, this.link, this.namespace);
    iframe.className = 'zb-frame';
    iframe.setAttribute('sandbox', FRAME_SANDBOX);
    iframe.setAttribute('allow', 'payment; clipboard-write');
    iframe.setAttribute('title', 'Booking');
    iframe.setAttribute('loading', 'eager');
    this.iframe = iframe;

    this.listener = (event: MessageEvent) => this.receive(event);
    window.addEventListener('message', this.listener);
  }

  private receive(event: MessageEvent): void {
    if (this.destroyed) return;
    if (event.origin !== this.origin) return;
    // A detached frame reports a null window. Comparing against it would let a
    // message with no source match every detached frame at once, so an absent
    // window is a refusal rather than a match.
    const own = this.iframe.contentWindow;
    if (!own || event.source !== own) return;
    if (!isWireMessage(event.data)) return;

    const message = event.data;
    if (message.ns !== this.namespace) return;

    if (message.type === INBOUND.ready) {
      this.ready = true;
      this.flush();
    }

    this.onMessage(message);
  }

  /** Sends whatever has been set so far. Safe to call before the frame is up. */
  private flush(): void {
    if (this.config) this.post(OUTBOUND.config, this.config);
    if (this.ui) this.post(OUTBOUND.ui, this.ui);
  }

  private post(type: string, payload: unknown): void {
    const target = this.iframe.contentWindow;
    if (!target) return;
    const message: WireMessage = { v: PROTOCOL_VERSION, ns: this.namespace, type, payload };
    target.postMessage(message, this.origin);
  }

  /** Replaces the prefill. Applied immediately if the frame is already up. */
  setConfig(config: BookConfig): void {
    assertValidMetadata(config.metadata);
    this.config = config;
    if (this.ready) this.post(OUTBOUND.config, config);
  }

  /** Replaces the appearance. Applied immediately if the frame is already up. */
  setUi(ui: UiConfig): void {
    this.ui = ui;
    if (this.ready) this.post(OUTBOUND.ui, ui);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener('message', this.listener);
    this.iframe.remove();
  }
}

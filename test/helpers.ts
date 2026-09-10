import { vi } from 'vitest';
import { PROTOCOL_VERSION } from '../src/wire';

export const ORIGIN = 'https://book.zoreal.com';

/** Finds the frame the SDK created, wherever it put its shadow root. */
export function findFrame(): HTMLIFrameElement {
  const hosts = document.querySelectorAll('[data-zoreal-book]');
  for (const host of hosts) {
    const frame = host.shadowRoot?.querySelector('iframe');
    if (frame) return frame as HTMLIFrameElement;
  }
  const loose = document.querySelector('iframe');
  if (!loose) throw new Error('no frame was created');
  return loose as HTMLIFrameElement;
}

export function shadowOf(kind: string): ShadowRoot {
  const host = document.querySelector(`[data-zoreal-book="${kind}"]`);
  if (!host?.shadowRoot) throw new Error(`no shadow root for ${kind}`);
  return host.shadowRoot;
}

/** Replays a frame-to-page message with the origin and source checks satisfied. */
export function send(
  frame: HTMLIFrameElement,
  type: string,
  payload: unknown = {},
  overrides: { origin?: string; source?: unknown; ns?: string; v?: number } = {},
): void {
  const event = new MessageEvent('message', {
    data: {
      v: overrides.v ?? PROTOCOL_VERSION,
      ns: overrides.ns ?? 'default',
      type,
      payload,
    },
    origin: overrides.origin ?? ORIGIN,
  });
  Object.defineProperty(event, 'source', {
    value: 'source' in overrides ? overrides.source : frame.contentWindow,
  });
  window.dispatchEvent(event);
}

/** Watches what the SDK posts into the frame. */
export function spyOnFrame(frame: HTMLIFrameElement) {
  const post = vi.fn();
  Object.defineProperty(frame, 'contentWindow', {
    configurable: true,
    value: { postMessage: post },
  });
  return post;
}

export function resetDom(): void {
  document.body.innerHTML = '';
}

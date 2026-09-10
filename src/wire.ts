/** Bumped by the release workflow. */
export const SDK_VERSION = '0.0.3';

/**
 * The version of the page/frame message contract.
 *
 * The booking page keeps answering the previous version for twelve months
 * after a bump, so a pinned package keeps working across a page deploy. A page
 * that cannot speak your version says so and fails the link, rather than
 * guessing at a message it does not understand.
 */
export const PROTOCOL_VERSION = 1;

export const DEFAULT_ORIGIN = 'https://book.zoreal.com';

export const DEFAULT_NAMESPACE = 'default';

/** Ten pairs, matching what the booking stores. */
export const METADATA_MAX_PAIRS = 10;

/** Messages the frame sends to your page. */
export const INBOUND = {
  ready: '__iframeReady',
  dimension: '__dimensionChanged',
  close: '__closeModal',
} as const;

/** Messages your page sends to the frame. */
export const OUTBOUND = {
  config: '__config',
  ui: '__ui',
} as const;

/** Frame-to-page messages that surface to integrators as events. */
export const PUBLIC_EVENTS = [
  'linkReady',
  'linkFailed',
  'bookingSuccessful',
  'bookingRequested',
  'rescheduleSuccessful',
  'bookingCancelled',
  'identityRequired',
  'identityVerified',
  'paymentStarted',
] as const;

export interface WireMessage<P = unknown> {
  v: number;
  ns: string;
  type: string;
  payload: P;
}

/**
 * Popups are allowed for exactly two reasons: pairing a ZOREAL ID on the same
 * device, and Stripe Checkout, which refuses to render inside a frame and so
 * opens in a new tab. Downloads are allowed for the calendar file a confirmed
 * booking offers. `allow-top-navigation` is deliberately absent, so the frame
 * can never move the page it is embedded in.
 */
export const FRAME_SANDBOX =
  'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads';

/** Strips a trailing slash so origin + path never doubles up. */
export function normaliseOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

/**
 * A link is `<handle>` or `<handle>/<slug>`. Slugs are minted by the server
 * and are never typed, so this rejects anything with a path, a query string or
 * an origin in it rather than passing it through to the frame URL.
 */
export function isValidLink(link: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)?$/.test(link);
}

export function assertValidLink(link: string): void {
  if (!isValidLink(link)) {
    throw new Error(
      `[ZorealBook] Invalid link ${JSON.stringify(link)}. Expected "<handle>" or "<handle>/<slug>", for example "acme" or "acme/kwm-drpt".`,
    );
  }
}

export function assertValidMetadata(metadata: Record<string, string> | undefined): void {
  if (!metadata) return;
  const keys = Object.keys(metadata);
  if (keys.length > METADATA_MAX_PAIRS) {
    throw new Error(
      `[ZorealBook] metadata takes at most ${METADATA_MAX_PAIRS} pairs, received ${keys.length}.`,
    );
  }
  for (const key of keys) {
    if (typeof metadata[key] !== 'string') {
      throw new Error(`[ZorealBook] metadata.${key} must be a string.`);
    }
  }
}

/**
 * The frame URL. It carries no personal data: prefill is posted over the
 * message channel once the frame reports it is ready, because a name or an
 * email in a URL ends up in server logs, browser history and referrer headers.
 */
export function frameUrl(origin: string, link: string, namespace: string): string {
  const url = new URL(`${normaliseOrigin(origin)}/${link}`);
  url.searchParams.set('embed', String(PROTOCOL_VERSION));
  url.searchParams.set('embedOrigin', window.location.origin);
  url.searchParams.set('ns', namespace);
  return url.toString();
}

/** Accepts only well-formed messages from the frame we opened. */
export function isWireMessage(data: unknown): data is WireMessage {
  if (typeof data !== 'object' || data === null) return false;
  const message = data as Partial<WireMessage>;
  return typeof message.type === 'string' && typeof message.ns === 'string' && typeof message.v === 'number';
}

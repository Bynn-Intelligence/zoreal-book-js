/** How the booking screens are painted. Appearance only: nothing here changes
 *  what can be booked, which is the host's decision on the event type. */
export type Theme = 'light' | 'dark' | 'auto';

/** The month grid is the only layout in this version. The field exists so a
 *  later one can be asked for without a breaking change. */
export type Layout = 'month';

/** What a host may require of a guest before a booking is made. Chosen per
 *  event type by the host; the embed can neither raise nor lower it. */
export type Requirement = 'open' | 'verified_human' | 'verified_identity';

/** Where the appointment happens. A `meet_room` booking creates a ZOREAL Meet
 *  room on confirmation; `none` is an in-person appointment at the host's
 *  published address. */
export type Location = 'meet_room' | 'none' | 'phone' | 'link';

export type BookingStatus = 'confirmed' | 'pending_approval' | 'pending_payment' | 'cancelled';

/** Why a link did not resolve to something bookable. */
export type LinkFailureReason =
  /** No such handle, or the host deleted the page. */
  | 'not_found'
  /** The event type exists but the host has hidden it. */
  | 'inactive'
  /** The host's plan does not include embedding on your own site. The frame
   *  shows a button to the hosted page, and you can fall back to a plain link. */
  | 'embed_not_available'
  /** The page speaks a newer protocol than this build of the SDK. Upgrade the
   *  package, or use the hosted script, which is always current. */
  | 'protocol_unsupported';

/**
 * What your site may pass into the booking screens.
 *
 * None of it is trusted. A prefilled email still gets verified when the event
 * type asks for verification, and a prefilled name is a convenience for the
 * guest, never an assertion about them.
 */
export interface BookConfig {
  /** Prefills the guest's name. */
  name?: string;
  /** Prefills the guest's email address. */
  email?: string;
  /** Prefills the guest's phone number, when the event type asks for one. */
  phone?: string;
  /** Additional attendees, by email, when the event type allows them. */
  guests?: string[];
  /** Prefills the notes field. */
  notes?: string;
  /** Prefills the host's own questions, keyed by question key. */
  answers?: Record<string, string | boolean>;
  /** IANA zone. Overrides the guest's detected zone. */
  timezone?: string;
  /** Open on a month, `YYYY-MM`. */
  month?: string;
  /** Open on a day, `YYYY-MM-DD`. */
  date?: string;
  /** Open with a slot already chosen, an ISO 8601 instant. */
  slot?: string;
  /** BCP 47 tag. Defaults to the guest's browser language. */
  locale?: string;
  /**
   * Up to ten string pairs carried on the booking and handed back on every
   * event. Your lead id, your campaign, your cart. Shown to the host, returned
   * to you, never shown to the guest.
   */
  metadata?: Record<string, string>;
}

/** Appearance, applied to every frame in a namespace. */
export interface UiConfig {
  theme?: Theme;
  /**
   * Your design tokens, applied inside the frame. Only names the booking page
   * publishes are honoured; anything else is ignored rather than injected.
   */
  cssVars?: Record<string, string>;
  /** Drop the left-hand detail pane and show only the month and the slots. */
  hideEventTypeDetails?: boolean;
  layout?: Layout;
}

/** The event type a booking was made against. */
export interface EventTypeSummary {
  slug: string;
  title: string;
  /** Minutes. */
  length: number;
}

/**
 * What every booking event carries.
 *
 * There is no guest name, no guest email and no verified identity here, on
 * purpose. Your site typed the prefill if it had it; a booking a stranger
 * makes on your page does not hand you their details. If you need them for
 * your own records, collect them on your own form first, pass them as prefill,
 * and match the booking back with `metadata`.
 */
export interface Booking {
  id: string;
  eventType: EventTypeSummary;
  /** ISO 8601 instant. */
  startsAt: string;
  /** ISO 8601 instant. */
  endsAt: string;
  /** IANA zone the guest booked in. */
  timezone: string;
  location: Location;
  status: BookingStatus;
  requirement: Requirement;
  metadata: Record<string, string>;
}

/** Every event this SDK emits, and what its payload holds. */
export interface BookEventMap {
  /** The link resolved and the screens are usable. */
  linkReady: { link: string };
  /** The link did not resolve. Fall back to a plain link to the hosted page. */
  linkFailed: { link: string; reason: LinkFailureReason };
  /** A booking was made and confirmed. */
  bookingSuccessful: { booking: Booking };
  /** A booking was made and is waiting for the host's approval. */
  bookingRequested: { booking: Booking };
  /** An existing booking was moved to a new slot. */
  rescheduleSuccessful: { booking: Booking };
  /** An existing booking was cancelled. */
  bookingCancelled: { booking: Booking };
  /** The event type requires proof and the guest has been asked for it. */
  identityRequired: { requirement: Requirement };
  /**
   * The guest passed. Carries the grade only: never a name, never a document,
   * never anything that identifies the person to your page.
   */
  identityVerified: { requirement: Requirement; grade: string };
  /** Checkout opened. Payment happens on Stripe's page, never in the frame. */
  paymentStarted: { bookingId: string; amount: number; currency: string };
}

export type BookEventName = keyof BookEventMap;
export type BookEventHandler<K extends BookEventName> = (payload: BookEventMap[K]) => void;

/** Where a floating button sits. */
export type FloatingPosition = 'bottom-right' | 'bottom-left';

export interface InitOptions {
  /** Defaults to `https://book.zoreal.com`. Set it only if you were told to. */
  origin?: string;
}

export interface InlineOptions {
  /** `<handle>` for the whole page, or `<handle>/<slug>` for one event type. */
  link: string;
  /** The element the frame is placed in, or a selector for it. */
  element: HTMLElement | string;
  config?: BookConfig;
}

export interface ModalOptions {
  link: string;
  config?: BookConfig;
}

export interface FloatingButtonOptions {
  link: string;
  text?: string;
  position?: FloatingPosition;
  /** Any CSS colour. */
  color?: string;
  /** Any CSS colour. */
  textColor?: string;
  config?: BookConfig;
}

export interface PreloadOptions {
  link: string;
}

/** What `inline()` hands back. */
export interface InlineHandle {
  /** Removes the frame and stops listening. */
  destroy(): void;
  /** Replaces the prefill without reloading the frame. */
  setConfig(config: BookConfig): void;
}

/** What `modal()` hands back. */
export interface ModalHandle {
  /** Closes the layer. */
  close(): void;
  /** Replaces the prefill without reloading the frame. */
  setConfig(config: BookConfig): void;
}

/** What `floatingButton()` hands back. */
export interface FloatingHandle {
  /** Removes the button. */
  destroy(): void;
}

# @zoreal/book-js

[![npm](https://img.shields.io/npm/v/@zoreal/book-js)](https://www.npmjs.com/package/@zoreal/book-js) [![types](https://img.shields.io/npm/types/@zoreal/book-js)](https://www.npmjs.com/package/@zoreal/book-js) [![CI](https://img.shields.io/github/actions/workflow/status/Bynn-Intelligence/zoreal-book-js/ci.yml?branch=main&label=CI)](https://github.com/Bynn-Intelligence/zoreal-book-js/actions/workflows/ci.yml) [![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Bynn-Intelligence/zoreal-book-js/badge)](https://scorecard.dev/viewer/?uri=github.com/Bynn-Intelligence/zoreal-book-js) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

ZOREAL Book inside your own site: the booking screens in an iframe your page
cannot read and that cannot read your page, with a small event API so your site
knows when a booking happened.

Framework-free, zero runtime dependencies, ESM and CJS. This is the core every
other Book embed is built on, including the `embed.js` that the one-tag snippet
loads and the React package.

```
@zoreal/book-js (this package)      the frame, the channel, the events
@zoreal/book-react                  the same thing as a component and a hook
book.zoreal.com/embed.js            the same thing as one script tag
```

## What ZOREAL Book is

Book is scheduling without the back and forth. You define the kinds of
appointment people can book with you, and a guest picks a free slot from a
calendar that never overlaps your real one.

Book is part of **ZOREAL Meet**, not a separate product. A booking that ends in
a call ends in a Meet room, and a booking that does not still lives on the same
calendar as your calls. You will find Book in the Meet section of your account,
alongside Calendar, Events and Availability.

What makes it different from other schedulers is the **requirement** you can set
per kind of appointment:

| Requirement | What the guest must do | Use it for |
|---|---|---|
| `open` | Give a name and an email, verified with a six-digit code | Ordinary demos, most public booking |
| `verified_human` | Prove they are a live human with ZOREAL ID, no name disclosed | Anything you do not want automated or spammed |
| `verified_identity` | Disclose their verified legal name | Consultations, clinics, regulated work |

The requirement is yours to choose per event type. The embed can neither raise
nor lower it, which is the point: your page cannot talk a guest past your own
rule.

## What it looks like

Inline, where the tag stands, on a host page with its own header and copy. The
screens size themselves to their content and bring their own styles:

![The booking screens rendered inline on a host page, under the page's own heading](docs/inline.png)

As a layer over the page, opened by a button the host already had. The layer
lives in a shadow root, so the host's CSS cannot reach it and its CSS cannot
leak out:

![The booking screens open as a layer over a host page, with the page dimmed behind](docs/modal.png)

## Install

```sh
npm install @zoreal/book-js
```

Or load it with no build step at all:

```html
<script src="https://book.zoreal.com/embed.js" data-zoreal-book="acme/kwm-drpt" async></script>
```

Using React? Install [`@zoreal/book-react`](https://github.com/Bynn-Intelligence/zoreal-book-react)
instead. It wraps this package and gives you a component and a hook.

## Getting your account and your booking link

1. Create an account at **https://zoreal.com**.
2. Open **Meet**, then **Book**.
3. Set your **availability**: the weekly hours you are bookable, in your time
   zone, plus any date overrides for holidays and days off.
4. Connect a **calendar** if you want your existing busy time respected and your
   bookings written back. Google and Microsoft 365 are supported. A local ZOREAL
   calendar works with no connection at all.
5. Create an **event type**: a title, a length, where it happens, and the
   requirement from the table above.
6. Copy its **link**. It looks like `acme/kwm-drpt`: your handle, then the
   address the server minted for that event type.

That link is the only thing this package needs. There is no API key, no client
id and no secret in the browser, because everything the embed can do is
something a stranger on your hosted page could already do.

**A handle on its own works too.** Pass `acme` instead of `acme/kwm-drpt` and
the frame shows your whole booking page, listing every active event type, and
lets the guest choose.

### Embedding is a paid feature

The packages are free to install and the script is free to load, because gating
a download gates nothing. The **page** is what checks: on a plan without
embedding, the frame renders a short screen with a button through to the hosted
page, and fires `linkFailed` with `reason: 'embed_not_available'` so your site
can fall back to a plain link. Booking still works; it just happens on the
hosted page rather than inside yours.

## Quick start: one script tag

The fastest integration. The tag reads its own attributes and needs no second
script.

```html
<!-- Renders the booking screens where the tag stands -->
<script src="https://book.zoreal.com/embed.js" data-zoreal-book="acme/kwm-drpt" async></script>
```

```html
<!-- Opens as a layer when a button is clicked, anywhere on the page -->
<script src="https://book.zoreal.com/embed.js" data-zoreal-book="acme/kwm-drpt" data-zoreal-book-mode="popup" async></script>

<button data-zoreal-book-link="acme/kwm-drpt">Book a demo</button>
```

```html
<!-- A button fixed to the corner of every page -->
<script src="https://book.zoreal.com/embed.js"
        data-zoreal-book="acme/kwm-drpt"
        data-zoreal-book-mode="floating"
        data-zoreal-book-text="Book a demo"
        async></script>
```

```html
<!-- Send the guest to the hosted page instead of embedding it -->
<script src="https://book.zoreal.com/embed.js" data-zoreal-book="acme/kwm-drpt" data-zoreal-book-mode="redirect" async></script>
```

Every attribute the tag understands:

| Attribute | Purpose |
|---|---|
| `data-zoreal-book` | The link. Required. `<handle>` or `<handle>/<slug>` |
| `data-zoreal-book-mode` | `inline` (default), `popup`, `floating`, `redirect` |
| `data-zoreal-book-theme` | `light`, `dark` or `auto` |
| `data-zoreal-book-config` | JSON prefill, see below |
| `data-zoreal-book-namespace` | An independent embed on the same page |
| `data-zoreal-book-text` | Floating mode: the button label |
| `data-zoreal-book-position` | Floating mode: `bottom-right` or `bottom-left` |
| `data-zoreal-book-color` | Floating mode: any CSS colour |
| `data-zoreal-book-text-color` | Floating mode: any CSS colour |

The tag also leaves the full API on `window.ZorealBook`, so you can start with
one tag and reach for anything below without changing how it loads.

## Quick start: the package

```js
import ZorealBook from '@zoreal/book-js';

ZorealBook.init();

ZorealBook.inline({
  link: 'acme/kwm-drpt',
  element: '#book',
});

ZorealBook.on('bookingSuccessful', ({ booking }) => {
  console.log('booked', booking.id, booking.startsAt);
});
```

```html
<div id="book"></div>
```

## The four ways to show it

### Inline

Renders where you point it and sizes itself to its own content, so there is
never a scrollbar inside a scrollbar.

```js
const embed = ZorealBook.inline({
  link: 'acme/kwm-drpt',
  element: document.querySelector('#book'),
  config: { metadata: { lead_id: 'L-4471' } },
});

// Later
embed.setConfig({ metadata: { lead_id: 'L-4471' }, notes: 'From the pricing page' });
embed.destroy();
```

### Modal

A layer over your page: the page dims and blurs, a ring turns until the times
are there, and the booking card appears at its own size with the close in the
corner of the window and the ZOREAL mark beneath it. Nothing of the SDK's is
drawn around the card. It closes by the close button, the backdrop, the Escape
key, or the guest finishing. The card is as tall as its content, up to the
height of the window; past that the layer scrolls, the frame never does, so
there is one scrollbar at most.

```js
const modal = ZorealBook.modal({ link: 'acme/kwm-drpt' });
// modal.close() if you need to close it yourself
```

### Floating button

```js
ZorealBook.floatingButton({
  link: 'acme/kwm-drpt',
  text: 'Book a demo',
  position: 'bottom-right',
  color: '#111827',
  textColor: '#ffffff',
});
```

### Redirect

Sends the guest to the hosted booking page instead of embedding it. Useful when
you would rather not take on a third-party frame at all, and the natural
fallback when `linkFailed` tells you embedding is not available.

```js
ZorealBook.redirect({ link: 'acme/kwm-drpt' });
ZorealBook.redirect({ link: 'acme/kwm-drpt', target: '_blank' });

// Or just the address, to put in an ordinary link
const href = ZorealBook.hostedUrl('acme/kwm-drpt');
```

### Click-to-open, with no JavaScript of your own

Any element carrying `data-zoreal-book-link` opens the layer when clicked. One
delegated listener covers elements you add to the page later.

```html
<button data-zoreal-book-link="acme/kwm-drpt">Book a demo</button>

<button data-zoreal-book-link="acme/kwm-drpt"
        data-zoreal-book-mode="redirect">Book on our scheduling page</button>

<a href="#" data-zoreal-book-link="acme/kwm-drpt"
   data-zoreal-book-config='{"metadata":{"campaign":"spring"}}'>Book a demo</a>
```

### Warm it before the click

```js
ZorealBook.preload({ link: 'acme/kwm-drpt' });
```

The next `modal()` for the same link adopts the warmed frame, so the screens are
already painted when the layer opens.

## Prefill

Everything your site already knows about the guest, so they do not type it
twice.

```js
ZorealBook.modal({
  link: 'acme/kwm-drpt',
  config: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+351900000000',
    guests: ['colleague@example.com'],
    notes: 'Interested in the enterprise plan',
    answers: { team_size: '50-200' },
    timezone: 'Europe/Lisbon',
    date: '2026-10-01',
    locale: 'en',
    metadata: { lead_id: 'L-4471', campaign: 'spring' },
  },
});
```

| Key | What it does |
|---|---|
| `name`, `email`, `phone` | Prefills the guest's details. Never trusted: an `open` event type still verifies the address with a code |
| `guests` | Additional attendees, by email, when the event type allows them |
| `notes` | Prefills the notes field |
| `answers` | Prefills your own questions, keyed by question key |
| `timezone` | IANA zone. Overrides detection |
| `month`, `date`, `slot` | Open on a month, a day, or a chosen slot |
| `locale` | BCP 47 tag. Defaults to the browser's language |
| `metadata` | Up to ten string pairs carried on the booking and returned on every event |

**Prefill never travels in the URL.** The frame is opened bare and the config is
posted to it over the message channel once it reports ready. A name or an email
in a URL ends up in server logs, browser history and referrer headers, and none
of those are places a guest's details belong. The address carries the link,
the protocol version, your page's origin, the namespace and, when you set one,
the theme, so the page's very first paint is in your scheme. Nothing else.

That rule is also why `redirect()` and `hostedUrl()` drop `name`, `email`,
`phone`, `guests`, `notes` and `answers` and warn in the console when you pass
them. They keep `month`, `date`, `slot`, `locale`, `timezone` and `metadata`,
which describe the appointment rather than the person.

### metadata is how you match a booking back to a lead

```js
ZorealBook.modal({
  link: 'acme/kwm-drpt',
  config: { metadata: { lead_id: crmLeadId } },
});

ZorealBook.on('bookingSuccessful', ({ booking }) => {
  crm.attachBooking(booking.metadata.lead_id, booking.id);
});
```

Ten pairs, strings only, shown to the host, returned to you, never shown to the
guest.

## Events

```js
ZorealBook.on('bookingSuccessful', ({ booking }) => analytics.track('Booked', {
  eventType: booking.eventType.slug,
  startsAt: booking.startsAt,
}));
```

| Event | Fires when |
|---|---|
| `linkReady` | The link resolved and the screens are usable |
| `linkFailed` | The link did not resolve. Fall back to a plain link |
| `bookingSuccessful` | A booking was made and confirmed |
| `bookingRequested` | A booking was made and is waiting for your approval |
| `rescheduleSuccessful` | An existing booking moved to a new slot |
| `bookingCancelled` | An existing booking was cancelled |
| `identityRequired` | The event type requires proof and the guest has been asked |
| `identityVerified` | The guest passed. Carries the grade only |
| `paymentStarted` | Checkout opened. Payment happens on Stripe's page, never in the frame |

Every booking event carries the same shape:

```json
{
  "booking": {
    "id": "bk_7QK39F2M",
    "eventType": { "slug": "kwm-drpt", "title": "Product demo", "length": 30 },
    "startsAt": "2026-10-01T13:00:00Z",
    "endsAt": "2026-10-01T13:30:00Z",
    "timezone": "Europe/Lisbon",
    "location": "meet_room",
    "status": "confirmed",
    "requirement": "verified_human",
    "metadata": { "lead_id": "L-4471" }
  }
}
```

### What events deliberately do not carry

**No guest name, no guest email, no verified identity.** Your site typed the
prefill if it had it. A booking a stranger makes on your page does not hand you
their details, and a verified identity check tells you it passed, never who
passed it.

If you need the guest's details for your own records, collect them on your own
form first, pass them as prefill, and match the booking back with `metadata`.
That way the data you hold is data the guest gave you, on your own terms.

### Handling a link that does not resolve

```js
ZorealBook.on('linkFailed', ({ link, reason }) => {
  if (reason === 'embed_not_available') {
    showPlainLink(ZorealBook.hostedUrl(link));
  }
});
```

| `reason` | Means |
|---|---|
| `not_found` | No such handle, or the page was deleted |
| `inactive` | The event type exists but is hidden |
| `embed_not_available` | The host's plan does not include embedding |
| `protocol_unsupported` | This build is older than the page expects. Upgrade the package, or use the hosted script, which is always current |

## Appearance

```js
ZorealBook.ui({
  theme: 'auto',
  hideEventTypeDetails: false,
  cssVars: {
    '--zb-accent': '#4c6ef5',
    '--zb-radius': '10px',
  },
});
```

`cssVars` are applied inside the frame, and only names the booking page
publishes are honoured. Anything else is ignored rather than injected.

**The embed brings its own CSS and takes none of yours.** Everything this
package paints on your page lives in a shadow root with its own stylesheet, so a
global `button { }` rule, a CSS reset or a utility framework's preflight cannot
reshape the modal or the floating button. The booking screens themselves are
painted inside the frame, on ZOREAL's origin, so they look the same on every
site that embeds them. You need to load no stylesheet and add no class names.

## Namespaces

Two independent embeds on one page, with separate frames, appearance and
listeners.

```js
ZorealBook.ns('sales').inline({ link: 'acme/kwm-drpt', element: '#sales' });
ZorealBook.ns('support').inline({ link: 'acme/jpy-wkqt', element: '#support' });

ZorealBook.ns('sales').on('bookingSuccessful', trackSalesBooking);
```

## API

| Call | Returns |
|---|---|
| `ZorealBook.init({ origin? })` | The API, for chaining. Also starts click-to-open |
| `ZorealBook.inline({ link, element, config? })` | `{ destroy(), setConfig(config) }` |
| `ZorealBook.modal({ link, config? })` | `{ close(), setConfig(config) }` |
| `ZorealBook.floatingButton({ link, text?, position?, color?, textColor?, config? })` | `{ destroy() }` |
| `ZorealBook.redirect({ link, config?, target? })` | Navigates |
| `ZorealBook.hostedUrl(link, config?)` | The hosted page address, as a string |
| `ZorealBook.preload({ link })` | Warms a frame |
| `ZorealBook.ui(config)` | The API, for chaining |
| `ZorealBook.on(event, handler)` / `.off(...)` | The API, for chaining |
| `ZorealBook.ns(name)` | That namespace's API, with all of the above |
| `ZorealBook.destroy()` | Tears down every namespace |
| `snippet({ link, mode?, origin? })` | The one-tag snippet, as a string |

## What your page needs to allow

Nothing, for most sites. The booking page is served so that any site may
frame it, the way Cal.com's is, so there is no allowlist to join, no domain
to register and no key to create. Paste the tag or install the package and it
works.

The one exception is a site that already sets a Content Security Policy.
Then the embed needs two directives:

```
script-src  https://book.zoreal.com
frame-src   https://book.zoreal.com
```

`script-src` is only needed if you load `embed.js` from the hosted address; the
npm package is your own bundle and needs nothing. `frame-src` is needed either
way, because the booking screens are an iframe.

That is the ordinary widget trade, and the iframe boundary is what keeps it
ordinary. The script never touches your DOM beyond the element you point it at,
and the guest's data lives inside the frame on ZOREAL's origin, not yours.

## How the frame is isolated

- **Sandboxed.** `allow-scripts allow-forms allow-same-origin allow-popups
  allow-popups-to-escape-sandbox allow-downloads`. Popups are needed exactly
  twice: pairing a ZOREAL ID on the same device, and Stripe Checkout, which
  will not render inside a frame and opens in a new tab. Downloads cover the
  calendar file a confirmed booking offers. `allow-top-navigation` is
  deliberately absent, so the frame can never move your page.
- **Origin-checked in both directions.** Your page accepts a message only from
  the exact origin it opened, and only from that frame's own window. A frame
  that has not loaded reports no window, and a message with no source is refused
  rather than matched.
- **Namespaced.** A message for another embed on the same page is ignored.
- **Versioned.** The page keeps answering the previous protocol version for
  twelve months after a change, so a pinned package keeps working across a
  deploy. A page that cannot speak your version says so, rather than guessing.

## Browser support

Any evergreen browser. The package uses `postMessage`, `URL`, and attached
shadow roots, and nothing newer. There are no polyfills and no runtime
dependencies.

Server-side rendering is safe: nothing runs and nothing is created until you
call into it from the browser.

## Security

Report a vulnerability privately through [the repository's security
advisories](https://github.com/Bynn-Intelligence/zoreal-book-js/security/advisories/new).
See [SECURITY.md](./SECURITY.md).

Releases are published from CI with npm provenance, so every version on npm can
be traced to the commit and the workflow that built it.

## The ZOREAL Book embed family

| Package | For |
|---|---|
| [`@zoreal/book-js`](https://github.com/Bynn-Intelligence/zoreal-book-js) | Plain JavaScript, any framework, and the hosted `embed.js` |
| [`@zoreal/book-react`](https://github.com/Bynn-Intelligence/zoreal-book-react) | React 18 and 19: a component, a hook, and click-to-open |

Wrappers for other frameworks sit on this package. The API is small enough that
one is a short piece of work: create the frame on mount, tear it down on
unmount, and forward the events.

## License

MIT. See [LICENSE](./LICENSE).

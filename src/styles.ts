/**
 * Everything this SDK paints on your page.
 *
 * It is injected into a shadow root, never into your document, so your CSS
 * cannot reach it and it cannot reach your CSS. That matters more than it
 * sounds: a global `button { ... }` rule, a Tailwind preflight or a
 * `* { box-sizing: content-box }` on the host page would otherwise reshape the
 * modal and the floating button, and every site would break differently.
 *
 * The booking screens themselves are not styled from here at all. They are
 * painted by the booking page inside the frame, on ZOREAL's origin, so they
 * look the same on every site that embeds them.
 */
export const STYLES = `
:host {
  all: initial;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.zb-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 64px 24px 24px;
  background: rgba(10, 12, 18, 0.72);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity 160ms ease;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.zb-overlay[data-open="true"] {
  opacity: 1;
}

/* The dialog is the page's own card and nothing around it: no ground, no
   frame of ours. The frame is transparent and the page paints only the card,
   so what the guest sees is the card on the dimmed page, sized to itself. */
.zb-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1024px;
  max-height: calc(100vh - 128px);
  background: transparent;
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* Shown once the page has its times: it opens at the size of what is in it. */
.zb-overlay[data-open="true"] .zb-dialog[data-ready="true"] {
  opacity: 1;
  transform: none;
}

/* In the corner of the page, on the backdrop, the way a layer's close is
   expected: never over the times. */
.zb-close {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transition: background 120ms ease;
}

.zb-close:hover {
  background: rgba(255, 255, 255, 0.24);
}

.zb-close:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.zb-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  padding: 6px 10px;
  border-radius: 8px;
  color: #ffffff;
  opacity: 0.86;
  transition: opacity 120ms ease;
}

.zb-brand:hover {
  opacity: 1;
}

.zb-brand:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.zb-brand svg {
  display: block;
  height: 18px;
  width: auto;
  fill: currentColor;
}

.zb-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  /* A frame stays transparent only while its element and its document agree
     on a scheme; otherwise the browser paints an opaque canvas behind the
     page. With no theme given the page follows the browser, so the element
     says the same; with one given, both say that. */
  color-scheme: light dark;
}

.zb-dialog[data-theme="dark"] .zb-frame,
.zb-inline[data-theme="dark"] .zb-frame {
  color-scheme: dark;
}

.zb-dialog[data-theme="light"] .zb-frame,
.zb-inline[data-theme="light"] .zb-frame {
  color-scheme: light;
}

.zb-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 16px;
}

.zb-body .zb-frame {
  height: 520px;
  transition: height 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.zb-inline {
  position: relative;
  width: 100%;
  min-height: 520px;
  transition: height 180ms ease;
}

.zb-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.zb-spinner[hidden] {
  display: none;
}

.zb-spinner::after {
  content: "";
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(15, 18, 23, 0.16);
  border-top-color: rgba(15, 18, 23, 0.5);
  animation: zb-spin 640ms linear infinite;
}

/* On the backdrop the ring is white, and a little larger. */
.zb-overlay .zb-spinner::after {
  width: 32px;
  height: 32px;
  border-color: rgba(255, 255, 255, 0.28);
  border-top-color: #ffffff;
}

@keyframes zb-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .zb-overlay,
  .zb-dialog,
  .zb-inline,
  .zb-body .zb-frame { transition: none; }
  .zb-spinner::after { animation-duration: 2s; }
}

.zb-float {
  position: fixed;
  bottom: 24px;
  z-index: 2147482000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 0;
  border-radius: 999px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(15, 18, 23, 0.24);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.zb-float:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(15, 18, 23, 0.28);
}

.zb-float:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
}

.zb-float[data-position="bottom-right"] { right: 24px; }
.zb-float[data-position="bottom-left"] { left: 24px; }

@media (max-width: 640px) {
  .zb-overlay { padding: 0; gap: 0; }
  .zb-dialog {
    height: 100vh;
    max-height: 100vh;
    max-width: none;
  }
  .zb-body { border-radius: 0; }
  /* The dialog fills the screen, so the close sits over the page's own
     ground and the mark has nowhere to go. */
  .zb-close {
    top: 12px;
    right: 12px;
    background: rgba(15, 18, 23, 0.6);
  }
  .zb-close:hover { background: rgba(15, 18, 23, 0.8); }
  .zb-brand { display: none; }
}
`;

/** The ZOREAL wordmark, inline for the same reason: the layer fetches nothing. */
export const BRAND_MARK = `
<svg viewBox="0 0 161.5 37.8" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<path d="M139.6,29.6h15.3v-3.5h-11.5V7.8h-3.8v21.8ZM91.6,11.3v5.6h10.9v3.5h-10.9v5.8h12.5v3.5h-16.3V7.8h16.2v3.5h-12.4ZM76,14.9c0,1.1-.4,2-1.2,2.7-.8.7-1.9,1-3.3,1h-5.6v-7.3h5.6c1.4,0,2.6.3,3.4.9.8.6,1.2,1.5,1.2,2.7ZM80.6,29.6l-5.9-8.3c.8-.2,1.4-.5,2.1-.9s1.2-.9,1.7-1.4c.4-.5.8-1.2,1.1-1.9s.4-1.5.4-2.4-.1-2-.5-2.9c-.4-.9-.9-1.6-1.7-2.2-.6-.6-1.5-1-2.5-1.4-1-.3-2.2-.4-3.4-.4h-9.8v21.8h3.8v-7.6h4.8l5.4,7.6h4.5ZM50.3,18.8c0,1.1-.1,2.1-.5,3s-.9,1.7-1.5,2.4-1.4,1.2-2.4,1.7c-.9.4-1.9.6-3,.6s-2.1-.1-3-.6-1.7-1-2.4-1.7-1.2-1.5-1.5-2.4-.5-1.9-.5-3,.1-2.1.5-3,.9-1.7,1.5-2.4,1.4-1.2,2.4-1.7c.9-.4,1.9-.6,3-.6s2.1.2,3,.6c.9.4,1.7,1,2.3,1.7.6.6,1.2,1.5,1.6,2.4s.5,1.9.5,3ZM54.3,18.7c0-1.5-.3-3-.8-4.4-.6-1.4-1.4-2.5-2.4-3.6-1-1-2.2-1.8-3.6-2.4-1.4-.6-3-.9-4.6-.9s-3.2.4-4.6.9c-1.4.6-2.7,1.4-3.7,2.4s-1.8,2.2-2.4,3.6c-.5,1.4-.8,2.8-.8,4.4s.3,3,.8,4.4c.6,1.4,1.4,2.5,2.4,3.6,1,1,2.2,1.8,3.6,2.4,1.4.6,3,.9,4.6.9s3.2-.4,4.6-.9c1.4-.6,2.6-1.4,3.7-2.4,1-1,1.8-2.2,2.4-3.6.5-1.4.8-2.9.8-4.4ZM20.7,11.2l-13,15.6v2.8h17.9v-3.4h-12.9l12.9-15.6v-2.8H8.1v3.4h12.5ZM123.1,7.6h-3.5l-9.6,22h4c3.7-8.8,3.4-8,7.4-17.4,3.7,8.8,3.9,9.1,7.4,17.4h4l-9.6-22Z"/>
</svg>`;

/** The close glyph, drawn rather than loaded, so the SDK fetches no assets. */
export const CLOSE_ICON = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

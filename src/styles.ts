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
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 18, 23, 0.55);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 160ms ease;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.zb-overlay[data-open="true"] {
  opacity: 1;
}

.zb-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1024px;
  max-height: calc(100vh - 48px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(15, 18, 23, 0.28);
  overflow: hidden;
  transform: translateY(8px) scale(0.99);
  transition: transform 160ms ease;
}

.zb-overlay[data-open="true"] .zb-dialog {
  transform: none;
}

.zb-dialog[data-theme="dark"] {
  background: #14171c;
}

.zb-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(15, 18, 23, 0.06);
  color: #3b4351;
  transition: background 120ms ease;
}

.zb-close:hover {
  background: rgba(15, 18, 23, 0.12);
}

.zb-close:focus-visible {
  outline: 2px solid #4c6ef5;
  outline-offset: 2px;
}

.zb-dialog[data-theme="dark"] .zb-close {
  background: rgba(255, 255, 255, 0.1);
  color: #dfe3ea;
}

.zb-dialog[data-theme="dark"] .zb-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

.zb-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}

/* The frame element's own scheme follows the theme it was given, so a dark
   layer never shows a light canvas around a dark page while it loads. */
.zb-dialog[data-theme="dark"] .zb-frame,
.zb-inline[data-theme="dark"] .zb-frame {
  color-scheme: dark;
}

.zb-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.zb-body .zb-frame {
  height: 520px;
  transition: height 180ms ease;
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
  .zb-overlay { padding: 0; }
  .zb-dialog {
    height: 100vh;
    max-height: 100vh;
    max-width: none;
    border-radius: 0;
  }
}
`;

/** The close glyph, drawn rather than loaded, so the SDK fetches no assets. */
export const CLOSE_ICON = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

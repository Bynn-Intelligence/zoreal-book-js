import { ZorealBook, ns } from './index';
import { bindAttributes } from './attributes';
import type { BookConfig, FloatingPosition } from './types';
import { DEFAULT_NAMESPACE } from './wire';

/**
 * The build that `book.zoreal.com/embed.js` serves.
 *
 * It is the same core as the npm package, wrapped so that one script tag is a
 * whole integration: the tag reads its own attributes, renders itself, and
 * leaves the full API on `window.ZorealBook` for anything more involved.
 */
declare global {
  interface Window {
    ZorealBook?: typeof ZorealBook;
  }
}

function currentScript(): HTMLScriptElement | null {
  const current = document.currentScript as HTMLScriptElement | null;
  if (current?.getAttribute('data-zoreal-book')) return current;
  return document.querySelector<HTMLScriptElement>('script[data-zoreal-book]');
}

function parseConfig(raw: string | null): BookConfig | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as BookConfig;
  } catch {
    console.error('[ZorealBook] data-zoreal-book-config is not valid JSON');
    return undefined;
  }
}

function boot(): void {
  const script = currentScript();
  if (!script) return;

  const link = script.getAttribute('data-zoreal-book');
  if (!link) return;

  const origin = script.getAttribute('data-zoreal-book-origin') || new URL(script.src, window.location.href).origin;
  ZorealBook.init({ origin });

  const namespace = script.getAttribute('data-zoreal-book-namespace') || DEFAULT_NAMESPACE;
  const config = parseConfig(script.getAttribute('data-zoreal-book-config'));
  const mode = script.getAttribute('data-zoreal-book-mode') || 'inline';
  const api = ns(namespace);

  const theme = script.getAttribute('data-zoreal-book-theme');
  if (theme === 'light' || theme === 'dark' || theme === 'auto') api.ui({ theme });

  if (mode === 'redirect') {
    api.redirect({ link, config });
    return;
  }

  if (mode === 'floating') {
    api.floatingButton({
      link,
      config,
      text: script.getAttribute('data-zoreal-book-text') || undefined,
      position: (script.getAttribute('data-zoreal-book-position') as FloatingPosition) || undefined,
      color: script.getAttribute('data-zoreal-book-color') || undefined,
      textColor: script.getAttribute('data-zoreal-book-text-color') || undefined,
    });
    return;
  }

  if (mode === 'popup' || mode === 'modal') {
    // Nothing renders until something is clicked. A button carrying
    // data-zoreal-book-link opens it; the attribute binding is already live.
    return;
  }

  // Inline: the frame takes the place the tag itself stands in, so the host
  // needs no container element and no second script.
  const mount = document.createElement('div');
  script.parentNode?.insertBefore(mount, script.nextSibling);
  api.inline({ link, element: mount, config });
}

window.ZorealBook = ZorealBook;
bindAttributes({ ns });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

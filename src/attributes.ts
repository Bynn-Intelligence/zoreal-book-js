import type { BookConfig } from './types';
import { DEFAULT_NAMESPACE } from './wire';

export interface AttributeHost {
  ns(name: string): {
    modal(options: { link: string; config?: BookConfig }): unknown;
    redirect(options: { link: string; config?: BookConfig }): unknown;
  };
}

function parseConfig(raw: string | null, element: Element): BookConfig | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as BookConfig;
  } catch {
    console.error('[ZorealBook] data-zoreal-book-config is not valid JSON', element);
    return undefined;
  }
}

/**
 * Click-to-open with no code at all.
 *
 * Any element carrying `data-zoreal-book-link` opens the booking layer when
 * clicked. One delegated listener covers elements added to the page later,
 * which a per-element listener would miss.
 */
export function bindAttributes(host: AttributeHost, doc: Document = document): () => void {
  const onClick = (event: Event) => {
    const target = event.target as Element | null;
    const trigger = target?.closest?.('[data-zoreal-book-link]') as HTMLElement | null;
    if (!trigger) return;

    const link = trigger.getAttribute('data-zoreal-book-link');
    if (!link) return;

    event.preventDefault();

    const namespace = trigger.getAttribute('data-zoreal-book-namespace') || DEFAULT_NAMESPACE;
    const config = parseConfig(trigger.getAttribute('data-zoreal-book-config'), trigger);
    const mode = trigger.getAttribute('data-zoreal-book-mode');

    if (mode === 'redirect') {
      host.ns(namespace).redirect({ link, config });
    } else {
      host.ns(namespace).modal({ link, config });
    }
  };

  doc.addEventListener('click', onClick);
  return () => doc.removeEventListener('click', onClick);
}

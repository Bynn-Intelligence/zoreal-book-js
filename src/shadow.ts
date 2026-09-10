import { STYLES } from './styles';

export interface ShadowHost {
  host: HTMLDivElement;
  root: ShadowRoot;
}

/**
 * A shadow root carrying this SDK's stylesheet.
 *
 * Everything the SDK renders on your page lives in one of these. Your styles
 * do not cross into it and its styles do not cross out, so the modal and the
 * floating button look the same whatever CSS your site ships.
 */
export function createShadowHost(kind: string): ShadowHost {
  const host = document.createElement('div');
  host.setAttribute('data-zoreal-book', kind);
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLES;
  root.appendChild(style);
  return { host, root };
}

import { DEFAULT_ORIGIN, assertValidLink, normaliseOrigin } from './wire';

export type SnippetMode = 'inline' | 'popup' | 'redirect' | 'floating';

export interface SnippetOptions {
  link: string;
  /** Defaults to `inline`, which renders where the tag stands. */
  mode?: SnippetMode;
  origin?: string;
}

/**
 * The one-tag snippet, as a string.
 *
 * This is what a dashboard hands a host to paste into their own site. The tag
 * needs no second script: it reads its link and its mode from its own
 * attributes.
 */
export function snippet(options: SnippetOptions): string {
  assertValidLink(options.link);
  const origin = normaliseOrigin(options.origin ?? DEFAULT_ORIGIN);
  const mode = options.mode ?? 'inline';
  const modeAttr = mode === 'inline' ? '' : ` data-zoreal-book-mode="${mode}"`;
  return `<script src="${origin}/embed.js" data-zoreal-book="${options.link}"${modeAttr} async></script>`;
}

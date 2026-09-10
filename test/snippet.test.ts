// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { snippet } from '../src/snippet';

describe('the one-tag snippet', () => {
  it('is the inline embed by default', () => {
    expect(snippet({ link: 'bynn/miz-ewbs' })).toBe(
      '<script src="https://book.zoreal.com/embed.js" data-zoreal-book="bynn/miz-ewbs" async></script>',
    );
  });

  it('names the mode when it is not inline', () => {
    expect(snippet({ link: 'bynn/miz-ewbs', mode: 'popup' })).toContain(
      'data-zoreal-book-mode="popup"',
    );
    expect(snippet({ link: 'bynn/miz-ewbs', mode: 'redirect' })).toContain(
      'data-zoreal-book-mode="redirect"',
    );
  });

  it('honours a different origin without doubling the slash', () => {
    expect(snippet({ link: 'bynn/miz-ewbs', origin: 'https://book.example.com/' })).toContain(
      'src="https://book.example.com/embed.js"',
    );
  });

  it('refuses a link that is not a booking address', () => {
    expect(() => snippet({ link: 'https://evil.example' })).toThrow(/Invalid link/);
  });
});

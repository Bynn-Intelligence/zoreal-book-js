// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  assertValidMetadata,
  frameUrl,
  isValidLink,
  isWireMessage,
  normaliseOrigin,
} from '../src/wire';

describe('link validation', () => {
  it('accepts a handle and a handle with a minted slug', () => {
    expect(isValidLink('acme')).toBe(true);
    expect(isValidLink('acme/kwm-drpt')).toBe(true);
    expect(isValidLink('bynn/miz-ewbs')).toBe(true);
  });

  it('refuses anything that would escape the booking path', () => {
    expect(isValidLink('acme/demo/extra')).toBe(false);
    expect(isValidLink('../secret')).toBe(false);
    expect(isValidLink('acme?x=1')).toBe(false);
    expect(isValidLink('https://evil.example/acme')).toBe(false);
    expect(isValidLink('Acme')).toBe(false);
    expect(isValidLink('')).toBe(false);
  });
});

describe('metadata', () => {
  it('allows ten pairs', () => {
    const ten = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`k${i}`, 'v']));
    expect(() => assertValidMetadata(ten)).not.toThrow();
  });

  it('refuses an eleventh pair', () => {
    const eleven = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, 'v']));
    expect(() => assertValidMetadata(eleven)).toThrow(/at most 10/);
  });

  it('refuses a non-string value', () => {
    expect(() => assertValidMetadata({ n: 4 as unknown as string })).toThrow(/must be a string/);
  });
});

describe('frame URL', () => {
  it('carries the protocol version, the embedding origin and the namespace', () => {
    const url = new URL(frameUrl('https://book.zoreal.com', 'bynn/miz-ewbs', 'sales'));
    expect(url.pathname).toBe('/bynn/miz-ewbs');
    expect(url.searchParams.get('embed')).toBe('1');
    expect(url.searchParams.get('embedOrigin')).toBe(window.location.origin);
    expect(url.searchParams.get('ns')).toBe('sales');
  });

  it('never puts prefill in the address', () => {
    const url = frameUrl('https://book.zoreal.com', 'bynn/miz-ewbs', 'default');
    expect(url).not.toMatch(/name|email|phone|notes/i);
  });
});

describe('helpers', () => {
  it('normalises a trailing slash', () => {
    expect(normaliseOrigin('https://book.zoreal.com/')).toBe('https://book.zoreal.com');
  });

  it('rejects junk messages', () => {
    expect(isWireMessage(null)).toBe(false);
    expect(isWireMessage('hello')).toBe(false);
    expect(isWireMessage({ type: 'x' })).toBe(false);
    expect(isWireMessage({ v: 1, ns: 'default', type: 'x' })).toBe(true);
  });
});

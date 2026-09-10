import { defineConfig } from 'tsup';

// Two artefacts from one source: the library that integrators install from
// npm, and the self-initialising embed.js that book.zoreal.com serves for the
// one-tag snippet. Both speak the same wire protocol version, so a page and a
// script tag on the same site behave identically.
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: { embed: 'src/embed.ts' },
    format: ['iife'],
    minify: true,
    sourcemap: true,
    outExtension: () => ({ js: '.js' }),
  },
]);

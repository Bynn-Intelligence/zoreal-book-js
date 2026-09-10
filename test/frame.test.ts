// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookFrame } from '../src/frame';
import { INBOUND, OUTBOUND, PROTOCOL_VERSION } from '../src/wire';
import { ORIGIN, resetDom, send, spyOnFrame } from './helpers';

function makeFrame(onMessage = vi.fn()) {
  const frame = new BookFrame({
    origin: ORIGIN,
    namespace: 'default',
    link: 'bynn/miz-ewbs',
    onMessage,
  });
  document.body.appendChild(frame.iframe);
  return { frame, onMessage };
}

afterEach(() => resetDom());

describe('the channel refuses what it did not open', () => {
  it('ignores a message from another origin', () => {
    const { frame, onMessage } = makeFrame();
    spyOnFrame(frame.iframe);
    send(frame.iframe, 'bookingSuccessful', {}, { origin: 'https://evil.example' });
    expect(onMessage).not.toHaveBeenCalled();
    frame.destroy();
  });

  it('ignores a message from another window on the right origin', () => {
    const { frame, onMessage } = makeFrame();
    spyOnFrame(frame.iframe);
    send(frame.iframe, 'bookingSuccessful', {}, { source: { postMessage: () => undefined } });
    expect(onMessage).not.toHaveBeenCalled();
    frame.destroy();
  });

  it('ignores a message for another namespace', () => {
    const { frame, onMessage } = makeFrame();
    spyOnFrame(frame.iframe);
    send(frame.iframe, 'bookingSuccessful', {}, { ns: 'other' });
    expect(onMessage).not.toHaveBeenCalled();
    frame.destroy();
  });

  it('accepts a well-formed message', () => {
    const { frame, onMessage } = makeFrame();
    spyOnFrame(frame.iframe);
    send(frame.iframe, 'bookingSuccessful', { booking: { id: 'bk_1' } });
    expect(onMessage).toHaveBeenCalledTimes(1);
    frame.destroy();
  });

  it('ignores a message with no source, which a detached frame would match', () => {
    const { frame, onMessage } = makeFrame();
    Object.defineProperty(frame.iframe, 'contentWindow', { configurable: true, value: null });
    send(frame.iframe, 'bookingSuccessful', {}, { source: null });
    expect(onMessage).not.toHaveBeenCalled();
    frame.destroy();
  });

  it('stops listening once destroyed', () => {
    const { frame, onMessage } = makeFrame();
    spyOnFrame(frame.iframe);
    frame.destroy();
    send(frame.iframe, 'bookingSuccessful');
    expect(onMessage).not.toHaveBeenCalled();
  });
});

describe('prefill travels over the channel, not the address', () => {
  it('holds the config until the frame says it is ready', () => {
    const frame = new BookFrame({
      origin: ORIGIN,
      namespace: 'default',
      link: 'bynn/miz-ewbs',
      config: { name: 'Ada', email: 'ada@example.com' },
      onMessage: () => undefined,
    });
    document.body.appendChild(frame.iframe);
    const post = spyOnFrame(frame.iframe);

    expect(post).not.toHaveBeenCalled();
    expect(frame.iframe.src).not.toContain('ada@example.com');

    send(frame.iframe, INBOUND.ready);

    expect(post).toHaveBeenCalledWith(
      {
        v: PROTOCOL_VERSION,
        ns: 'default',
        type: OUTBOUND.config,
        payload: { name: 'Ada', email: 'ada@example.com' },
      },
      ORIGIN,
    );
    frame.destroy();
  });

  it('posts a later config straight away once ready', () => {
    const { frame } = makeFrame();
    const post = spyOnFrame(frame.iframe);
    send(frame.iframe, INBOUND.ready);
    post.mockClear();

    frame.setConfig({ notes: 'from the pricing page' });

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ type: OUTBOUND.config, payload: { notes: 'from the pricing page' } }),
      ORIGIN,
    );
    frame.destroy();
  });
});

describe('the frame is sandboxed', () => {
  it('allows scripts, forms and the two popups it needs, and never top navigation', () => {
    const { frame } = makeFrame();
    const sandbox = frame.iframe.getAttribute('sandbox') ?? '';
    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).toContain('allow-forms');
    expect(sandbox).toContain('allow-popups');
    expect(sandbox).not.toContain('allow-top-navigation');
    frame.destroy();
  });

  it('refuses a link that would escape the booking path', () => {
    expect(
      () =>
        new BookFrame({
          origin: ORIGIN,
          namespace: 'default',
          link: '../admin',
          onMessage: () => undefined,
        }),
    ).toThrow(/Invalid link/);
  });
});

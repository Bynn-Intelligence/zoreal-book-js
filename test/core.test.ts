// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZorealBook from '../src/index';
import { INBOUND } from '../src/wire';
import { ORIGIN, findFrame, resetDom, send, shadowOf, spyOnFrame } from './helpers';

afterEach(() => {
  ZorealBook.destroy();
  resetDom();
  vi.restoreAllMocks();
});

describe('inline', () => {
  it('renders inside a shadow root so the host page cannot restyle it', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);

    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: mount });

    const host = mount.querySelector('[data-zoreal-book="inline"]');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).not.toBeNull();
    expect(host?.shadowRoot?.querySelector('iframe')).not.toBeNull();
    expect(mount.querySelector('iframe')).toBeNull();
  });

  it('ships its own stylesheet rather than borrowing the page', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: mount });

    const style = shadowOf('inline').querySelector('style');
    expect(style?.textContent).toContain('.zb-inline');
    expect(style?.textContent).toContain(':host');
  });

  it('takes its height from the frame instead of showing a nested scrollbar', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: mount });

    const frame = findFrame();
    spyOnFrame(frame);
    send(frame, INBOUND.dimension, { height: 812 });

    const wrapper = shadowOf('inline').querySelector('.zb-inline') as HTMLElement;
    expect(wrapper.style.height).toBe('812px');
  });

  it('accepts a selector as well as an element', () => {
    document.body.innerHTML = '<div id="book"></div>';
    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: '#book' });
    expect(document.querySelector('#book [data-zoreal-book="inline"]')).not.toBeNull();
  });

  it('throws a useful error for a selector that matches nothing', () => {
    expect(() => ZorealBook.inline({ link: 'bynn/miz-ewbs', element: '#missing' })).toThrow(
      /No element matches/,
    );
  });
});

describe('modal', () => {
  it('opens a layer and closes on the frame asking', () => {
    ZorealBook.modal({ link: 'bynn/miz-ewbs' });
    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();

    const frame = findFrame();
    spyOnFrame(frame);
    send(frame, INBOUND.close);

    expect(document.querySelector('[data-zoreal-book="modal"]')).toBeNull();
  });

  it('closes on Escape', () => {
    ZorealBook.modal({ link: 'bynn/miz-ewbs' });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('[data-zoreal-book="modal"]')).toBeNull();
  });

  it('closes when the handle is asked to', () => {
    const modal = ZorealBook.modal({ link: 'bynn/miz-ewbs' });
    modal.close();
    expect(document.querySelector('[data-zoreal-book="modal"]')).toBeNull();
  });

  it('keeps only one layer open at a time', () => {
    ZorealBook.modal({ link: 'bynn/miz-ewbs' });
    ZorealBook.modal({ link: 'bynn/ciy-pkjd' });
    expect(document.querySelectorAll('[data-zoreal-book="modal"]').length).toBe(1);
  });
});

describe('events', () => {
  it('emits the public events and swallows the private ones', () => {
    const booked = vi.fn();
    const ready = vi.fn();
    ZorealBook.on('bookingSuccessful', booked);
    ZorealBook.on('linkReady', ready);

    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: mount });

    const frame = findFrame();
    spyOnFrame(frame);

    send(frame, INBOUND.ready);
    send(frame, 'linkReady', { link: 'bynn/miz-ewbs' });
    send(frame, 'bookingSuccessful', { booking: { id: 'bk_7QK39F2M' } });

    expect(ready).toHaveBeenCalledWith({ link: 'bynn/miz-ewbs' });
    expect(booked).toHaveBeenCalledWith({ booking: { id: 'bk_7QK39F2M' } });
  });

  it('stops calling a handler that was removed', () => {
    const booked = vi.fn();
    ZorealBook.on('bookingSuccessful', booked);
    ZorealBook.off('bookingSuccessful', booked);

    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: mount });

    const frame = findFrame();
    spyOnFrame(frame);
    send(frame, 'bookingSuccessful', { booking: { id: 'bk_1' } });

    expect(booked).not.toHaveBeenCalled();
  });

  it('keeps namespaces apart', () => {
    const sales = vi.fn();
    const support = vi.fn();
    ZorealBook.ns('sales').on('bookingSuccessful', sales);
    ZorealBook.ns('support').on('bookingSuccessful', support);

    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ZorealBook.ns('sales').inline({ link: 'bynn/miz-ewbs', element: mount });

    const frame = findFrame();
    spyOnFrame(frame);
    send(frame, 'bookingSuccessful', { booking: { id: 'bk_1' } }, { ns: 'sales' });

    expect(sales).toHaveBeenCalledTimes(1);
    expect(support).not.toHaveBeenCalled();
  });

  it('one throwing listener does not stop the next', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const second = vi.fn();
    ZorealBook.on('linkReady', () => {
      throw new Error('boom');
    });
    ZorealBook.on('linkReady', second);

    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ZorealBook.inline({ link: 'bynn/miz-ewbs', element: mount });

    const frame = findFrame();
    spyOnFrame(frame);
    send(frame, 'linkReady', { link: 'bynn/miz-ewbs' });

    expect(second).toHaveBeenCalled();
  });
});

describe('redirect', () => {
  it('builds the hosted address', () => {
    expect(ZorealBook.hostedUrl('bynn/miz-ewbs')).toBe(`${ORIGIN}/bynn/miz-ewbs`);
  });

  it('keeps prefill that describes the appointment', () => {
    const url = new URL(ZorealBook.hostedUrl('bynn/miz-ewbs', { date: '2026-10-01', locale: 'sv' }));
    expect(url.searchParams.get('date')).toBe('2026-10-01');
    expect(url.searchParams.get('locale')).toBe('sv');
  });

  it('drops prefill that would put a person in the address', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const url = ZorealBook.hostedUrl('bynn/miz-ewbs', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      date: '2026-10-01',
    });

    expect(url).not.toContain('ada@example.com');
    expect(url).not.toContain('Ada');
    expect(url).toContain('date=2026-10-01');
    expect(warn).toHaveBeenCalled();
  });

  it('carries metadata so a booking can be matched back to a lead', () => {
    const url = new URL(ZorealBook.hostedUrl('bynn/miz-ewbs', { metadata: { lead_id: 'L-4471' } }));
    expect(url.searchParams.get('md_lead_id')).toBe('L-4471');
  });
});

describe('floating button', () => {
  it('renders in its own shadow root and opens the layer', () => {
    ZorealBook.floatingButton({ link: 'bynn/miz-ewbs', text: 'Book a demo' });
    const button = shadowOf('floating').querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('Book a demo');

    button.click();
    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });
});

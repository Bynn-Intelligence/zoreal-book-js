// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import ZorealBook from '../src/index';
import { resetDom } from './helpers';

afterEach(() => {
  ZorealBook.destroy();
  resetDom();
  vi.restoreAllMocks();
});

describe('click-to-open needs no code', () => {
  it('opens the layer from a data attribute', () => {
    ZorealBook.init();
    document.body.innerHTML = '<button data-zoreal-book-link="bynn/miz-ewbs">Book</button>';

    (document.querySelector('button') as HTMLButtonElement).click();

    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });

  it('works for an element added to the page later', () => {
    ZorealBook.init();
    const button = document.createElement('button');
    button.setAttribute('data-zoreal-book-link', 'bynn/miz-ewbs');
    document.body.appendChild(button);

    button.click();

    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });

  it('opens from a child of the element carrying the attribute', () => {
    ZorealBook.init();
    document.body.innerHTML =
      '<button data-zoreal-book-link="bynn/miz-ewbs"><span id="inner">Book</span></button>';

    (document.querySelector('#inner') as HTMLElement).click();

    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });

  it('reads a namespace and a config off the element', () => {
    ZorealBook.init();
    const booked = vi.fn();
    ZorealBook.ns('sales').on('linkReady', booked);
    document.body.innerHTML =
      `<button data-zoreal-book-link="bynn/miz-ewbs" data-zoreal-book-namespace="sales" data-zoreal-book-config='{"metadata":{"lead_id":"L-1"}}'>Book</button>`;

    (document.querySelector('button') as HTMLButtonElement).click();

    expect(document.querySelector('[data-zoreal-book="modal"]')).not.toBeNull();
  });

  it('reports bad JSON instead of opening a broken layer', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    ZorealBook.init();
    document.body.innerHTML =
      `<button data-zoreal-book-link="bynn/miz-ewbs" data-zoreal-book-config="{oops">Book</button>`;

    (document.querySelector('button') as HTMLButtonElement).click();

    expect(error).toHaveBeenCalled();
  });

  it('ignores a click that is not on a booking trigger', () => {
    ZorealBook.init();
    document.body.innerHTML = '<button id="other">Something else</button>';

    (document.querySelector('#other') as HTMLButtonElement).click();

    expect(document.querySelector('[data-zoreal-book="modal"]')).toBeNull();
  });
});

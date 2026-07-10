import {TestBed} from '@angular/core/testing';
import {PrintService} from './print.service';

/**
 * Minimal stand-in for the frame's window; the real one would open a dialog.
 * `afterPrint()` replays the event the browser fires once the dialog closes,
 * which is the only thing that may tear the frame down.
 */
function fakeWindow(print: () => void = () => undefined) {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    focus: jasmine.createSpy('focus'),
    print: jasmine.createSpy('print').and.callFake(print),
    addEventListener: jasmine.createSpy('addEventListener').and.callFake(
      (type: string, fn: () => void) => (listeners[type] ??= []).push(fn)),
    afterPrint: () => (listeners['afterprint'] ?? []).forEach(fn => fn())
  };
}

describe('PrintService', () => {
  let service: PrintService;

  const frames = (): HTMLIFrameElement[] =>
    Array.from(document.body.querySelectorAll('iframe'));

  /** The frame's `load` event is a macrotask, so microtask ticks cannot see it. */
  async function waitFor(condition: () => boolean, what: string): Promise<void> {
    for (let i = 0; i < 100; i++) {
      if (condition()) return;
      await new Promise(resolve => setTimeout(resolve));
    }
    throw new Error(`timed out waiting for ${what}`);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintService);
  });

  afterEach(() => frames().forEach(f => f.remove()));

  function stubContentWindow(win: unknown): void {
    spyOnProperty(HTMLIFrameElement.prototype, 'contentWindow', 'get')
      .and.returnValue(win as Window);
  }

  // Guards a regression: appending the frame before assigning srcdoc makes the
  // browser load about:blank and fire `load` synchronously, so the service would
  // print an empty page and remove the frame before this assertion can see it.
  it('mounts an offscreen frame carrying the document', () => {
    const html = '<!DOCTYPE html><html><body>receipt</body></html>';
    stubContentWindow(fakeWindow());
    const before = frames().length;

    void service.printDocument(html, 'receipt');

    const live = frames();
    expect(live.length)
      .withContext('frame must still be mounted; srcdoc has to be set before insertion')
      .toBe(before + 1);

    const iframe = live[live.length - 1];
    expect(iframe.srcdoc).toBe(html);
    expect(iframe.title).toBe('receipt');
    expect(iframe.getAttribute('aria-hidden')).toBe('true');
    expect(iframe.style.position).toBe('fixed');
    expect(iframe.style.visibility).toBe('hidden');
  });

  it('focuses and prints the frame once loaded', async () => {
    const win = fakeWindow();
    stubContentWindow(win);

    const printing = service.printDocument('<html><body>x</body></html>');
    await waitFor(() => win.print.calls.any(), 'print()');
    win.afterPrint();
    await printing;

    expect(win.focus).toHaveBeenCalled();
    expect(win.print).toHaveBeenCalled();
  });

  // Guards the regression that made "save as PDF" a no-op: Chrome's scripted
  // print() queues the preview and returns immediately, so a frame removed as
  // soon as print() returns leaves the dialog nothing to render.
  it('keeps the frame mounted until the dialog closes', async () => {
    const win = fakeWindow();
    stubContentWindow(win);
    const before = frames().length;

    const printing = service.printDocument('<html><body>x</body></html>');
    await waitFor(() => win.print.calls.any(), 'print()');

    expect(frames().length)
      .withContext('frame must outlive print(); the dialog renders it asynchronously')
      .toBe(before + 1);

    win.afterPrint();
    await printing;
    expect(frames().length).toBe(before);
  });

  it('resolves only once the dialog reports closing', async () => {
    const win = fakeWindow();
    stubContentWindow(win);

    let resolved = false;
    const printing = service.printDocument('<html><body>x</body></html>')
      .then(() => (resolved = true));
    await waitFor(() => win.print.calls.any(), 'print()');

    expect(resolved).withContext('must not resolve while the dialog is open').toBeFalse();

    win.afterPrint();
    await printing;
    expect(resolved).toBeTrue();
  });

  it('rejects and cleans up when printing throws', async () => {
    stubContentWindow(fakeWindow(() => {
      throw new Error('blocked');
    }));
    const before = frames().length;

    await expectAsync(service.printDocument('<html><body>x</body></html>')).toBeRejected();
    expect(frames().length).toBe(before);
  });

  it('rejects and cleans up when the frame has no window', async () => {
    stubContentWindow(null);
    const before = frames().length;

    await expectAsync(service.printDocument('<html><body>x</body></html>')).toBeRejected();
    expect(frames().length).toBe(before);
  });
});

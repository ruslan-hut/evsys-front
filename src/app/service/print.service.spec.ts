import {TestBed} from '@angular/core/testing';
import {PrintService} from './print.service';

/** Minimal stand-in for the frame's window; the real one would open a dialog. */
function fakeWindow(print: () => void = () => undefined) {
  return {
    focus: jasmine.createSpy('focus'),
    print: jasmine.createSpy('print').and.callFake(print),
    addEventListener: jasmine.createSpy('addEventListener')
  };
}

describe('PrintService', () => {
  let service: PrintService;

  const frames = (): HTMLIFrameElement[] =>
    Array.from(document.body.querySelectorAll('iframe'));

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

  it('focuses and prints the frame once loaded, then tears it down', async () => {
    const win = fakeWindow();
    stubContentWindow(win);
    const before = frames().length;

    await service.printDocument('<html><body>x</body></html>');

    expect(win.focus).toHaveBeenCalled();
    expect(win.print).toHaveBeenCalled();
    expect(frames().length).toBe(before);
  });


  it('waits for afterprint before resolving', async () => {
    const win = fakeWindow();
    stubContentWindow(win);

    await service.printDocument('<html><body>x</body></html>');

    // The frame must be given a chance to report the dialog closing, otherwise
    // removing it mid-dialog cancels the print job.
    expect(win.addEventListener).toHaveBeenCalledWith(
      'afterprint', jasmine.any(Function), {once: true});
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

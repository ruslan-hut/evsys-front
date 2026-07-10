import {Injectable, inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';

/**
 * Prints a standalone HTML document without navigating away from the app.
 *
 * The document is mounted in an offscreen same-origin iframe via `srcdoc` and
 * printed from there, which is what lets the user pick "Save as PDF" in the
 * browser's print dialog.
 */
@Injectable({providedIn: 'root'})
export class PrintService {
  private readonly document = inject(DOCUMENT);

  /**
   * Frames whose dialog never reported closing are swept after this long. Long
   * enough that a user reading the preview cannot have the job pulled from
   * under them; short enough that a stuck frame does not live for the session.
   */
  private static readonly CLEANUP_TIMEOUT_MS = 10 * 60 * 1000;

  printDocument(html: string, title = 'document'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const iframe = this.document.createElement('iframe');
      iframe.title = title;
      iframe.setAttribute('aria-hidden', 'true');
      // Offscreen rather than display:none — a hidden frame has no layout, and
      // some browsers refuse to print one.
      iframe.style.cssText =
        'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (err?: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        iframe.remove();
        err ? reject(err) : resolve();
      };

      iframe.onload = (): void => {
        const frame = iframe.contentWindow;
        if (!frame) {
          finish(new Error('print frame unavailable'));
          return;
        }
        // Chrome's scripted print() only *queues* the preview and returns
        // immediately, so the frame must stay mounted until the dialog is gone:
        // removing it here leaves the preview nothing to render and the job is
        // silently dropped. afterprint marks that moment. It reaches the frame
        // in some browsers and only the host window in others, so listen on
        // both, and sweep the frame if neither ever reports.
        const onAfterPrint = (): void => finish();
        frame.addEventListener('afterprint', onAfterPrint, {once: true});
        this.document.defaultView?.addEventListener('afterprint', onAfterPrint, {once: true});
        timer = setTimeout(() => finish(), PrintService.CLEANUP_TIMEOUT_MS);

        try {
          frame.focus();
          frame.print();
        } catch (e) {
          finish(e instanceof Error ? e : new Error('print failed'));
        }
      };

      iframe.onerror = (): void => finish(new Error('print frame failed to load'));

      // srcdoc must be set before insertion. Attaching the frame first makes the
      // browser load its initial about:blank and fire `load` for it, so we would
      // print an empty page and remove the frame before the receipt renders.
      iframe.srcdoc = html;
      this.document.body.appendChild(iframe);
    });
  }
}

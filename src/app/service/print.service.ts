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
      const finish = (err?: Error): void => {
        if (settled) return;
        settled = true;
        iframe.remove();
        err ? reject(err) : resolve();
      };

      iframe.onload = (): void => {
        const frame = iframe.contentWindow;
        if (!frame) {
          finish(new Error('print frame unavailable'));
          return;
        }
        // Tearing the frame down before the dialog closes cancels the job, so
        // wait for afterprint. Browsers that never fire it still resolve, because
        // print() only returns once the dialog is dismissed.
        frame.addEventListener('afterprint', () => finish(), {once: true});
        try {
          frame.focus();
          frame.print();
        } catch (e) {
          finish(e instanceof Error ? e : new Error('print failed'));
          return;
        }
        finish();
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

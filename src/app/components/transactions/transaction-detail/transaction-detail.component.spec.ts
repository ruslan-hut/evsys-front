import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionService } from '../../../service/transaction.service';
import { PaymentRetryService } from '../../../service/payment-retry.service';
import { AccountService } from '../../../service/account.service';
import { PrintService } from '../../../service/print.service';
import { ErrorService } from '../../../service/error.service';
import { TransactionListItem } from '../../../models/transaction-list-item';

const TRANSACTION = {
  transaction_id: 4207,
  charge_point_id: 'PE00003',
  connector_id: 2,
  meter_start: 1000,
  meter_stop: 16500,
  time_start: '2026-05-20T08:00:00Z',
  time_stop: '2026-05-20T09:30:00Z',
  payment_billed: 1234
} as TransactionListItem;

describe('TransactionDetailComponent', () => {
  let fixture: ComponentFixture<TransactionDetailComponent>;
  let component: TransactionDetailComponent;
  let transactionService: MockedObject<Pick<TransactionService,
    'getTransactionDetails' | 'sendTransactionEmail' | 'getTransactionReceipt'>>;
  let printService: MockedObject<Pick<PrintService, 'printDocument'>>;
  let errorService: MockedObject<Pick<ErrorService, 'handle'>>;
  let dialog: MockedObject<Pick<MatDialog, 'open'>>;

  beforeEach(async () => {
    transactionService = {
      getTransactionDetails: vi.fn().mockName("TransactionService.getTransactionDetails"),
      sendTransactionEmail: vi.fn().mockName("TransactionService.sendTransactionEmail"),
      getTransactionReceipt: vi.fn().mockName("TransactionService.getTransactionReceipt")
    };
    transactionService.getTransactionDetails.mockReturnValue(of(TRANSACTION));
    transactionService.getTransactionReceipt.mockReturnValue(of('<html><body>receipt</body></html>'));
    transactionService.sendTransactionEmail.mockReturnValue(of({ success: true }));

    printService = {
      printDocument: vi.fn().mockName("PrintService.printDocument")
    };
    printService.printDocument.mockResolvedValue();

    errorService = {
      handle: vi.fn().mockName("ErrorService.handle")
    };
    dialog = {
      open: vi.fn().mockName("MatDialog.open")
    };

    const retryService = {
      list: vi.fn().mockName("PaymentRetryService.list"),
      forceRetry: vi.fn().mockName("PaymentRetryService.forceRetry")
    };
    retryService.list.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: TransactionService, useValue: transactionService },
        { provide: PaymentRetryService, useValue: retryService },
        { provide: AccountService, useValue: { userValue: { email: 'me@example.com' } } },
        { provide: PrintService, useValue: printService },
        { provide: ErrorService, useValue: errorService },
        { provide: MatDialog, useValue: dialog },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '4207' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function headerButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.header-actions button') as NodeListOf<HTMLButtonElement>);
  }

  it('renders three header buttons: back, save pdf, send email', () => {
    const buttons = headerButtons();
    expect(buttons.length).toBe(3);
    expect(buttons.map(b => b.querySelector('mat-icon')?.textContent?.trim()))
      .toEqual(['arrow_back', 'picture_as_pdf', 'email']);
  });

  it('shows icons only, with no visible button text', () => {
    for (const button of headerButtons()) {
      const icon = button.querySelector('mat-icon')!;
      // Strip the icon ligature; whatever remains would be rendered as a label.
      const label = (button.textContent ?? '').replace(icon.textContent ?? '', '').trim();
      expect(label, `button "${icon.textContent}" still renders text`).toBe('');
    }
  });

  it('gives every header button an aria-label', () => {
    for (const button of headerButtons()) {
      expect(button.getAttribute('aria-label')?.length, `icon button "${button.querySelector('mat-icon')?.textContent}" needs a label`).toBeGreaterThan(0);
    }
  });

  it('fetches the receipt and hands it to the print service', async () => {
    component.savePdf();
    await fixture.whenStable();

    expect(transactionService.getTransactionReceipt).toHaveBeenCalledWith(4207);
    expect(printService.printDocument)
      .toHaveBeenCalledWith('<html><body>receipt</body></html>', 'transaction-4207');
    expect(component.savingPdf).toBe(false);
  });

  it('reports a failed receipt fetch and clears the busy flag', async () => {
    transactionService.getTransactionReceipt.mockReturnValue(throwError(() => new Error('boom')));

    component.savePdf();
    await fixture.whenStable();

    expect(printService.printDocument).not.toHaveBeenCalled();
    expect(errorService.handle).toHaveBeenCalled();
    expect(component.savingPdf).toBe(false);
  });

  it('reports a failed print and clears the busy flag', async () => {
    printService.printDocument.mockRejectedValue(new Error('blocked'));

    component.savePdf();
    await fixture.whenStable();

    expect(errorService.handle).toHaveBeenCalled();
    expect(component.savingPdf).toBe(false);
  });
});

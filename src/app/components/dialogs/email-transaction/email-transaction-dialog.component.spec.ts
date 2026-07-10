import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {TranslateModule} from '@ngx-translate/core';

import {
  EmailTransactionDialogComponent,
  EmailTransactionDialogData
} from './email-transaction-dialog.component';

describe('EmailTransactionDialogComponent', () => {
  let fixture: ComponentFixture<EmailTransactionDialogComponent>;
  let component: EmailTransactionDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EmailTransactionDialogComponent>>;

  function setup(data: EmailTransactionDialogData): void {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [
        EmailTransactionDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        {provide: MatDialogRef, useValue: dialogRef},
        {provide: MAT_DIALOG_DATA, useValue: data}
      ]
    });

    fixture = TestBed.createComponent(EmailTransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('prefills the account email', () => {
    setup({transactionId: 42, defaultEmail: 'me@example.com'});
    expect(component.email.value).toBe('me@example.com');
    expect(component.email.valid).toBeTrue();
  });

  it('starts empty and invalid when no account email exists', () => {
    setup({transactionId: 42});
    expect(component.email.value).toBe('');
    expect(component.email.hasError('required')).toBeTrue();
  });

  it('rejects addresses the backend would reject', () => {
    setup({transactionId: 42});
    for (const bad of ['not-an-email', 'a@b', 'a b@example.com', 'a@b.c']) {
      component.email.setValue(bad);
      expect(component.email.valid)
        .withContext(`"${bad}" must be invalid`).toBeFalse();
    }
  });

  it('accepts a well formed address', () => {
    setup({transactionId: 42});
    component.email.setValue('user.name+tag@sub.example.co');
    expect(component.email.valid).toBeTrue();
  });

  it('closes with the trimmed address on send', () => {
    setup({transactionId: 42, defaultEmail: 'me@example.com'});
    component.send();
    expect(dialogRef.close).toHaveBeenCalledWith('me@example.com');
  });

  it('does not close while the address is invalid', () => {
    setup({transactionId: 42});
    component.email.setValue('nope');
    component.send();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.email.touched).toBeTrue();
  });

  it('disables the send button until the address is valid', () => {
    setup({transactionId: 42});
    const sendButton = (): HTMLButtonElement =>
      fixture.nativeElement.querySelectorAll('button')[1];

    expect(sendButton().disabled).toBeTrue();

    component.email.setValue('me@example.com');
    fixture.detectChanges();
    expect(sendButton().disabled).toBeFalse();
  });
});

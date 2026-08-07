import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorService} from "../../service/error.service";
import {AccountService} from "../../service/account.service";
import { TranslateService } from '@ngx-translate/core';
import { NOT_AUTHORIZED_KEY } from '../../helpers/error.interceptor';

@Component({
    selector: 'app-snack-bar',
    templateUrl: './snack-bar.component.html',
    styleUrls: ['./snack-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnackBarComponent implements OnInit {
  private readonly snack = inject(MatSnackBar);
  private readonly accountService = inject(AccountService);
  private readonly errorService = inject(ErrorService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  openSnackBar(message: string, action: string){
    this.snack.open(message, action, {duration: 5000});
  }

  ngOnInit(): void {
    this.errorService.error$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(error => {
      if (error === NOT_AUTHORIZED_KEY || error === 'Not authorized') {
        this.accountService.reAuthenticate();
        return;
      }
      const message = this.translateIfKey(error);
      const action = this.translate.instant('common.dismiss');
      this.openSnackBar(message, action);
    })
  }

  private translateIfKey(value: string): string {
    if (value && value.startsWith('errors.')) {
      const translated = this.translate.instant(value);
      return translated === value ? value : translated;
    }
    return value;
  }
}

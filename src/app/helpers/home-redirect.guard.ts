import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../service/account.service';
import { map, take } from 'rxjs/operators';

export const homeRedirectGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const router = inject(Router);

  return accountService.authReady$.pipe(
    take(1),
    map(() => {
      const user = accountService.userValue;
      if (user && (accountService.isAdmin || accountService.isOperator)) {
        return router.createUrlTree(['/dashboard']);
      }
      return router.createUrlTree(['/points']);
    })
  );
};

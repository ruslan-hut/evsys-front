import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../service/account.service';
import { LocalStorageService } from '../service/local-storage.service';
import { map, take } from 'rxjs/operators';

const ADMIN_OPERATOR_PAGES = ['/points', '/dashboard', '/reports', '/log/system'];
const USER_PAGES = ['/points'];

export const homeRedirectGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  return accountService.authReady$.pipe(
    take(1),
    map(() => {
      const isAdminOrOperator = accountService.isAdmin || accountService.isOperator;
      const allowedPages = isAdminOrOperator ? ADMIN_OPERATOR_PAGES : USER_PAGES;
      const defaultPage = isAdminOrOperator ? '/dashboard' : '/points';

      const storedStartPage = localStorageService.getStartPage();
      const targetPage = storedStartPage && allowedPages.includes(storedStartPage)
        ? storedStartPage
        : defaultPage;

      return router.createUrlTree([targetPage]);
    })
  );
};

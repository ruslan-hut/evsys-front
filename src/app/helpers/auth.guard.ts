import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AccountService } from '../service/account.service';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const user = accountService.userValue;

  if (!user) {
    return false;
  }

  return user.role === environment.admin || user.role === environment.operator;
};

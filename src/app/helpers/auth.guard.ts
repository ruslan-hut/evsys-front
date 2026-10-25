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

/** Admins only: pages that operators may not open, such as the AI analysis settings. */
export const adminGuard: CanActivateFn = () => {
  const user = inject(AccountService).userValue;
  return !!user && user.role === environment.admin;
};

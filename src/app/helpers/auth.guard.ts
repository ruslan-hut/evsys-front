import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot} from '@angular/router';
import {AccountService} from "../service/account.service";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(
    private accountService: AccountService
  ) {
  }

  canActivate(): boolean {
    const user = this.accountService.userValue;
    if (!user) {
      return false;
    }
    return user.role === environment.admin || user.role === environment.operator;
  }

}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(AuthGuard).canActivate();
}

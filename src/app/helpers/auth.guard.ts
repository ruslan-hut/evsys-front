import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AccountService} from "../service/account.service";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(
    private router: Router,
    private accountService: AccountService
  ) {
  }

  canActivate(): boolean {
    const user = this.accountService.userValue;
    return user.role === environment.admin;
  }

}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(AuthGuard).canActivate();
}

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { AccountService } from '../service/account.service';
import { User } from '../models/user';
import { environment } from '../../environments/environment';

/** Runs the guard inside an injection context, as the router would. */
function runGuard(userValue: User | null): boolean {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: AccountService, useValue: { userValue } }]
  });

  return TestBed.runInInjectionContext(
    () => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  ) as boolean;
}

function userWithRole(role: string): User {
  return { username: 'someone', role } as User;
}

describe('authGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('denies access when nobody is signed in', () => {
    expect(runGuard(null)).toBe(false);
  });

  it('admits an admin', () => {
    expect(runGuard(userWithRole(environment.admin))).toBe(true);
  });

  it('admits an operator', () => {
    expect(runGuard(userWithRole(environment.operator))).toBe(true);
  });

  it('denies a signed-in user holding any other role', () => {
    for (const role of ['user', 'guest', '', 'Admin', 'ADMIN']) {
      expect(runGuard(userWithRole(role)))
        .toBe(false);
    }
  });

  it('denies a user whose role is absent', () => {
    expect(runGuard({ username: 'someone' } as User)).toBe(false);
  });
});

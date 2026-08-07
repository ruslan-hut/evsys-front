import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

import { homeRedirectGuard } from './home-redirect.guard';
import { AccountService } from '../service/account.service';
import { LocalStorageService } from '../service/local-storage.service';

interface Scenario {
  isAdmin?: boolean;
  isOperator?: boolean;
  startPage?: string | null;
}

/** Runs the guard and resolves to the path it redirects to. */
async function redirectTarget({isAdmin = false, isOperator = false, startPage = null}: Scenario) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AccountService,
        useValue: { authReady$: of(true), isAdmin, isOperator }
      },
      { provide: LocalStorageService, useValue: { getStartPage: () => startPage } }
    ]
  });

  const result = TestBed.runInInjectionContext(
    () => homeRedirectGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  ) as Observable<UrlTree>;

  const tree = await new Promise<UrlTree>(resolve => result.subscribe(resolve));
  return TestBed.inject(Router).serializeUrl(tree);
}

describe('homeRedirectGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('sends an admin with no stored page to the dashboard', async () => {
    expect(await redirectTarget({ isAdmin: true })).toBe('/dashboard');
  });

  it('sends an operator with no stored page to the dashboard', async () => {
    expect(await redirectTarget({ isOperator: true })).toBe('/dashboard');
  });

  it('sends a plain user with no stored page to the charge points', async () => {
    expect(await redirectTarget({})).toBe('/points');
  });

  it('honours a stored page the role is allowed to open', async () => {
    expect(await redirectTarget({ isAdmin: true, startPage: '/reports' })).toBe('/reports');
    expect(await redirectTarget({ isAdmin: true, startPage: '/log/system' })).toBe('/log/system');
  });

  it('ignores a stored admin page for a plain user and falls back', async () => {
    // /reports is admin-only; a user who once held the role must not be sent there.
    expect(await redirectTarget({ startPage: '/reports' })).toBe('/points');
    expect(await redirectTarget({ startPage: '/dashboard' })).toBe('/points');
  });

  it('ignores a stored page that is not a known destination', async () => {
    expect(await redirectTarget({ isAdmin: true, startPage: '/nonsense' })).toBe('/dashboard');
    expect(await redirectTarget({ startPage: '/nonsense' })).toBe('/points');
  });

  it('lets a plain user keep /points, the one page they share with admins', async () => {
    expect(await redirectTarget({ startPage: '/points' })).toBe('/points');
  });
});

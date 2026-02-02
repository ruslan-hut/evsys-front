import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, take } from 'rxjs';

import { HeaderComponent } from './components/ui/header/header.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import { OfflineBannerComponent } from './components/offline-banner/offline-banner.component';
import { AccountService } from './service/account.service';
import { PwaUpdateService } from './service/pwa-update.service';
import { ThemeService } from './service/theme.service';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/account/login',
  '/account/register',
  '/privacy',
  '/terms',
  '/company-info',
  '/bank'
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SnackBarComponent, OfflineBannerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly accountService = inject(AccountService);
  private readonly pwaUpdateService = inject(PwaUpdateService); // Inject to initialize update checks
  private readonly themeService = inject(ThemeService); // Inject to initialize theme

  title = 'WattBrews';
  showHeader = signal(true);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute.root),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      map(route => route.snapshot),
      map(snapshot => snapshot.queryParamMap)
    ).subscribe(queryParamMap => {
      if (queryParamMap.has('header')) {
        this.showHeader.set(queryParamMap.get('header') !== 'false');
      }
    });
  }

  ngOnInit(): void {
    // Wait for auth initialization to complete, then redirect if not logged in
    this.accountService.authReady$.pipe(take(1)).subscribe(() => {
      if (!this.accountService.userValue && !this.isPublicRoute()) {
        this.router.navigate(['/account/login']);
      }
    });
  }

  private isPublicRoute(): boolean {
    // Use window.location.pathname as router.url may not be ready during initial load
    const currentUrl = window.location.pathname;
    return PUBLIC_ROUTES.some(route => currentUrl.startsWith(route));
  }

}

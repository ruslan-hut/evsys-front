import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { filter, map, take } from 'rxjs';

import { CommandPaletteComponent } from './components/ui/command-palette/command-palette.component';
import { ShortcutService } from './service/shortcut.service';

import { HeaderComponent } from './components/ui/header/header.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import { OfflineBannerComponent } from './components/offline-banner/offline-banner.component';
import { AccountService } from './service/account.service';
import { PwaUpdateService } from './service/pwa-update.service';
import { ThemeService } from './service/theme.service';
import { LanguageService } from './service/language.service';

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
  imports: [RouterOutlet, HeaderComponent, SnackBarComponent, OfflineBannerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)'
  }
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly accountService = inject(AccountService);
  private readonly pwaUpdateService = inject(PwaUpdateService); // Inject to initialize update checks
  private readonly themeService = inject(ThemeService); // Inject to initialize theme
  private readonly languageService = inject(LanguageService);
  private readonly shortcuts = inject(ShortcutService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  title = 'WattBrews';
  showHeader = signal(true);

  private paletteRef: MatDialogRef<CommandPaletteComponent> | null = null;

  constructor() {
    this.languageService.init();

    this.shortcuts.paletteToggled$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.togglePalette());

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

  onKeydown(event: KeyboardEvent): void {
    // Shortcuts are for signed-in operators; the login screen keeps its keys.
    if (!this.accountService.userValue) {
      return;
    }
    if (this.shortcuts.handleKeydown(event)) {
      event.preventDefault();
    }
  }

  private togglePalette(): void {
    if (this.paletteRef) {
      this.paletteRef.close();
      return;
    }

    this.paletteRef = this.dialog.open(CommandPaletteComponent, {
      width: '560px',
      maxWidth: '94vw',
      position: { top: '10vh' },
      autoFocus: true,
      restoreFocus: true,
      panelClass: 'command-palette-panel'
    });

    this.paletteRef.afterClosed().subscribe(() => {
      this.paletteRef = null;
    });
  }
}

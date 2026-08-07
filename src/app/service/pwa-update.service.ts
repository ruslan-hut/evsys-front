import { Injectable, ApplicationRef, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, concat, interval } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);
  private snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private updateAvailable = new BehaviorSubject<boolean>(false);

  /** Observable that emits true when an update is available */
  updateAvailable$ = this.updateAvailable.asObservable();

  /** Whether service worker is enabled */
  get isEnabled(): boolean {
    return this.swUpdate.isEnabled;
  }

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Listen for version updates
    this.swUpdate.versionUpdates.pipe(
      filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      console.log('PWA: New version available:', event.latestVersion);
      this.updateAvailable.next(true);
      this.promptUpdate();
    });

    // Handle unrecoverable state (corrupted cache)
    this.swUpdate.unrecoverable.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      console.error('PWA: Unrecoverable state:', event.reason);
      this.snackBar.open(
        'App error. Please refresh the page.',
        'Refresh',
        { duration: 0 }
      ).onAction().subscribe(() => {
        window.location.reload();
      });
    });

    // Check for updates periodically (every 6 hours)
    this.setupPeriodicUpdateCheck();
  }

  /** Manually check for updates */
  checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }
    return this.swUpdate.checkForUpdate();
  }

  /** Apply the update and reload */
  applyUpdate(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.activateUpdate().then(() => {
      window.location.reload();
    });
  }

  private promptUpdate(): void {
    const snackBarRef = this.snackBar.open(
      'New version available',
      'Update',
      {
        duration: 0, // Don't auto-dismiss
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: 'pwa-update-snackbar'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.applyUpdate();
    });
  }

  private setupPeriodicUpdateCheck(): void {
    // Wait for app to stabilize, then check every 6 hours
    const appIsStable$ = this.appRef.isStable.pipe(
      first(stable => stable)
    );

    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkForUpdate().then(hasUpdate => {
        if (hasUpdate) {
          console.log('PWA: Update check - new version found');
        }
      });
    });
  }
}

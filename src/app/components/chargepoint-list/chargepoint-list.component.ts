import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChargepointService } from '../../service/chargepoint.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { ShortcutService } from '../../service/shortcut.service';
import { Router } from '@angular/router';
import { ChargepointComponent } from '../chargepoint/chargepoint.component';
import { Chargepoint } from '../../models/chargepoint';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export type StatusFilter = 'all' | 'online' | 'charging' | 'offline';
export type SortKey = 'status' | 'title' | 'updated';

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css'],
  imports: [
    ChargepointComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonToggleModule,
    FormsModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargepointListComponent implements OnInit, OnDestroy {
  private readonly chargepointService = inject(ChargepointService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(ShortcutService);

  private destroy$ = new Subject<void>();

  private readonly filterInput = viewChild<ElementRef<HTMLInputElement>>('filterInput');

  readonly chargePoints = signal<Chargepoint[]>([]);
  readonly loading = signal(true);
  readonly showingFullList = signal(false);

  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly sortKey = signal<SortKey>('status');

  /** Placeholder rows rendered while the first request is in flight. */
  readonly skeletonRows = [0, 1, 2, 3];

  readonly visibleChargePoints = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();

    const matches = this.chargePoints().filter(chp => {
      if (status !== 'all' && this.operationalState(chp) !== status) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [chp.title, chp.address, chp.description, chp.charge_point_id, chp.status]
        .some(field => field?.toLowerCase().includes(q));
    });

    return this.sort(matches, this.sortKey());
  });

  readonly totalCount = computed(() => this.chargePoints().length);
  readonly visibleCount = computed(() => this.visibleChargePoints().length);
  readonly isFiltered = computed(() => this.query().trim() !== '' || this.statusFilter() !== 'all');

  ngOnInit(): void {
    this.redirectToChargePointScreen();
    if (this.localStorageService.getAlwaysLoadAllChargers()) {
      this.loadFullList();
    } else {
      this.loadRecentChargePoints();
    }
    this.chargepointService.subscribeOnUpdates();
    this.listenForUpdates();

    this.shortcuts.filterFocusRequested$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.focusFilter());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chargepointService.unsubscribeFromUpdates();
  }

  /**
   * Replaces a single charge point in place when the WebSocket reports it
   * changed, so the list reflects live state without a refetch.
   */
  private listenForUpdates(): void {
    this.chargepointService.chargePointUpdated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      this.chargePoints.update(current => {
        const index = current.findIndex(chp => chp.charge_point_id === updated.charge_point_id);
        if (index === -1) {
          return current;
        }
        const next = [...current];
        next[index] = updated;
        return next;
      });
    });
  }

  private loadRecentChargePoints(): void {
    this.chargepointService.getRecentChargePoints().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: result => {
        if (result && result.length > 0) {
          this.chargePoints.set(result);
          this.loading.set(false);
        } else {
          this.loadFullList();
        }
      },
      error: () => this.loading.set(false)
    });
  }

  loadFullList(): void {
    this.showingFullList.set(true);
    this.loading.set(true);
    this.chargepointService.getAllChargePoints().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: result => {
        if (result) {
          this.chargePoints.set(result);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  focusFilter(): void {
    this.filterInput()?.nativeElement.focus();
  }

  clearFilter(): void {
    this.query.set('');
    this.focusFilter();
  }

  resetFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
  }

  trackById(_index: number, chp: Chargepoint): string {
    return chp.charge_point_id ?? chp.title;
  }

  /**
   * Collapses a charge point's connectors into the one state an operator
   * filters by. Offline wins over everything, then an active session.
   */
  private operationalState(chp: Chargepoint): StatusFilter {
    if (!chp.is_online) {
      return 'offline';
    }
    const charging = (chp.connectors || []).some(c => c.current_transaction_id > -1);
    return charging ? 'charging' : 'online';
  }

  /** Ranks charge points needing attention first. */
  private attentionRank(chp: Chargepoint): number {
    if (!chp.is_online) {
      return 0;
    }
    const hasError = (chp.connectors || []).some(
      c => c.status?.toLowerCase() === 'faulted' || c.status?.toLowerCase() === 'unavailable'
    );
    if (hasError) {
      return 1;
    }
    return (chp.connectors || []).some(c => c.current_transaction_id > -1) ? 2 : 3;
  }

  private sort(items: Chargepoint[], key: SortKey): Chargepoint[] {
    const sorted = [...items];
    switch (key) {
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'updated':
        return sorted.sort((a, b) => (b.event_time || '').localeCompare(a.event_time || ''));
      case 'status':
      default:
        return sorted.sort((a, b) => {
          const rank = this.attentionRank(a) - this.attentionRank(b);
          return rank !== 0 ? rank : (a.title || '').localeCompare(b.title || '');
        });
    }
  }

  redirectToChargePointScreen(): void {
    const redirectUrl = this.localStorageService.getRedirectUrl();
    if (redirectUrl) {
      this.router.navigate(['new-transactions'], {
        queryParams: { charge_point_id: redirectUrl.charge_point_id, connector_id: redirectUrl.connector_id }
      });
    }
  }
}

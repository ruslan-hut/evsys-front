import { Injectable, inject } from '@angular/core';
import { SortDirection } from '@angular/material/sort';

import { AccountService } from './account.service';
import { TransactionListItem } from '../models/transaction-list-item';

export interface TransactionListState {
  /**
   * Query params the list was opened with. A snapshot is only restored for the
   * same key, so arriving from a user page with a different `username` still
   * starts from that link's own filters instead of the previous visit's.
   */
  queryKey: string;

  startDate: Date;
  endDate: Date;
  usernameFilter: string;
  idTagFilter: string;
  chargePointFilter: string;
  withErrorFilter: boolean;

  rows: TransactionListItem[];
  pageIndex: number;
  pageSize: number;
  sortActive: string;
  sortDirection: SortDirection;
}

/**
 * Keeps the transactions list filters, paging and sorting alive while the user
 * steps into a transaction detail and back. The list component is destroyed on
 * navigation, so the snapshot has to outlive it.
 */
@Injectable({ providedIn: 'root' })
export class TransactionListStateService {
  private state: TransactionListState | null = null;

  constructor() {
    // Rows belong to the signed-in user; never carry them into the next session.
    inject(AccountService).user$.subscribe(user => {
      if (!user) this.clear();
    });
  }

  save(state: TransactionListState): void {
    this.state = state;
  }

  /**
   * Returns the snapshot only if it was taken for the same query params, and
   * consumes it: a later fresh visit to the list starts from the defaults.
   */
  restore(queryKey: string): TransactionListState | null {
    const state = this.state;
    this.state = null;
    return state && state.queryKey === queryKey ? state : null;
  }

  clear(): void {
    this.state = null;
  }
}

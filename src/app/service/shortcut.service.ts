import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AccountService } from './account.service';

/** A single entry in the command palette. */
export interface Command {
  id: string;
  /** i18n key for the visible label. */
  labelKey: string;
  /** i18n key for the group heading this command sits under. */
  groupKey: string;
  icon: string;
  /** Key sequence hint shown on the right, e.g. "g p". */
  hint?: string;
  /** Extra words matched by the palette filter but not displayed. */
  keywords?: string;
  route: string;
  adminOnly?: boolean;
}

const COMMANDS: Command[] = [
  { id: 'points', labelKey: 'shortcuts.commands.points', groupKey: 'shortcuts.groups.operations', icon: 'ev_station', hint: 'g p', route: '/points', keywords: 'chargers stations' },
  { id: 'transactions', labelKey: 'shortcuts.commands.transactions', groupKey: 'shortcuts.groups.operations', icon: 'receipt_long', hint: 'g t', route: '/transactions', adminOnly: true, keywords: 'sessions charges' },

  { id: 'dashboard', labelKey: 'shortcuts.commands.dashboard', groupKey: 'shortcuts.groups.monitoring', icon: 'insights', hint: 'g d', route: '/dashboard', adminOnly: true, keywords: 'consumption chart' },
  { id: 'statistic', labelKey: 'shortcuts.commands.statistic', groupKey: 'shortcuts.groups.monitoring', icon: 'bar_chart', route: '/statistic', adminOnly: true },
  { id: 'uptime', labelKey: 'shortcuts.commands.uptime', groupKey: 'shortcuts.groups.monitoring', icon: 'monitor_heart', route: '/reports?tab=uptime', adminOnly: true },
  { id: 'power', labelKey: 'shortcuts.commands.power', groupKey: 'shortcuts.groups.monitoring', icon: 'bolt', route: '/reports?tab=power', adminOnly: true },
  { id: 'smart', labelKey: 'shortcuts.commands.smart', groupKey: 'shortcuts.groups.monitoring', icon: 'ev_station', route: '/reports?tab=smart', adminOnly: true },
  { id: 'export', labelKey: 'shortcuts.commands.export', groupKey: 'shortcuts.groups.monitoring', icon: 'file_download', route: '/export', adminOnly: true, keywords: 'download csv' },

  { id: 'users', labelKey: 'shortcuts.commands.users', groupKey: 'shortcuts.groups.management', icon: 'group', hint: 'g u', route: '/users', adminOnly: true },
  { id: 'tags', labelKey: 'shortcuts.commands.tags', groupKey: 'shortcuts.groups.management', icon: 'nfc', route: '/user-tags', adminOnly: true, keywords: 'rfid cards' },
  { id: 'mail', labelKey: 'shortcuts.commands.mail', groupKey: 'shortcuts.groups.management', icon: 'mail', route: '/mail-subscriptions', adminOnly: true },
  { id: 'webhooks', labelKey: 'shortcuts.commands.webhooks', groupKey: 'shortcuts.groups.management', icon: 'webhook', route: '/webhooks', adminOnly: true },

  { id: 'syslog', labelKey: 'shortcuts.commands.systemLog', groupKey: 'shortcuts.groups.diagnostics', icon: 'terminal', hint: 'g l', route: '/log/system', adminOnly: true },
  { id: 'paylog', labelKey: 'shortcuts.commands.paymentLog', groupKey: 'shortcuts.groups.diagnostics', icon: 'account_balance_wallet', route: '/log/pay', adminOnly: true },
  { id: 'retries', labelKey: 'shortcuts.commands.paymentRetries', groupKey: 'shortcuts.groups.diagnostics', icon: 'autorenew', route: '/payment-retries', adminOnly: true },

  { id: 'profile', labelKey: 'shortcuts.commands.profile', groupKey: 'shortcuts.groups.account', icon: 'account_circle', route: '/user-profile', keywords: 'theme language appearance' },
];

/** Second key of a `g` sequence -> route. */
const GOTO_KEYS: Record<string, string> = {
  p: '/points',
  t: '/transactions',
  d: '/dashboard',
  u: '/users',
  l: '/log/system',
  r: '/reports',
};

/** How long after `g` the second key still counts as part of the sequence. */
const SEQUENCE_TIMEOUT_MS = 1500;

@Injectable({ providedIn: 'root' })
export class ShortcutService {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  private readonly paletteToggled = new Subject<void>();
  private readonly filterFocusRequested = new Subject<void>();

  /** Cmd/Ctrl+K was pressed. */
  readonly paletteToggled$ = this.paletteToggled.asObservable();
  /** `/` was pressed — the current page should focus its filter input. */
  readonly filterFocusRequested$ = this.filterFocusRequested.asObservable();

  private pendingSequence: string | null = null;
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Commands the signed-in user is allowed to run. */
  availableCommands(): Command[] {
    const privileged = this.accountService.isAdmin || this.accountService.isOperator;
    return COMMANDS.filter(command => !command.adminOnly || privileged);
  }

  requestFilterFocus(): void {
    this.filterFocusRequested.next();
  }

  /** Opens the command palette (or closes it if already open). */
  openPalette(): void {
    this.paletteToggled.next();
  }

  navigate(route: string): void {
    this.router.navigateByUrl(route);
  }

  /**
   * Handles a global key press. Returns true when the shortcut was consumed,
   * so the caller can prevent the browser's default behaviour.
   */
  handleKeydown(event: KeyboardEvent): boolean {
    if (event.altKey) {
      return false;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      this.paletteToggled.next();
      return true;
    }

    // Every remaining shortcut is a bare key, so typing must always win.
    if (event.metaKey || event.ctrlKey || this.isTextEntry(event.target)) {
      return false;
    }

    if (this.pendingSequence === 'g') {
      const key = event.key.toLowerCase();

      // A repeated 'g' re-arms rather than failing the sequence, so a double
      // tap behaves the way it does everywhere else that uses this idiom.
      if (key === 'g') {
        this.startSequence('g');
        return true;
      }

      const route = GOTO_KEYS[key];
      this.clearSequence();
      if (route) {
        this.navigate(route);
        return true;
      }
      return false;
    }

    if (event.key === 'g') {
      this.startSequence('g');
      return true;
    }

    if (event.key === '/') {
      this.filterFocusRequested.next();
      return true;
    }

    if (event.key === '?') {
      this.paletteToggled.next();
      return true;
    }

    return false;
  }

  private startSequence(key: string): void {
    this.pendingSequence = key;
    this.clearTimer();
    this.sequenceTimer = setTimeout(() => this.clearSequence(), SEQUENCE_TIMEOUT_MS);
  }

  private clearSequence(): void {
    this.pendingSequence = null;
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  /** True when the event came from somewhere the user is typing. */
  private isTextEntry(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }
}

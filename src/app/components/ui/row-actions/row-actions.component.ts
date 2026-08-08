import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';

/** One entry in a row's overflow menu. */
export interface RowAction {
  /** i18n key for the menu label. Keep it short — the row is the context. */
  labelKey: string;
  icon: string;
  /** Destructive actions render in the warn colour and sit last. */
  warn?: boolean;
  disabled?: boolean;
  run: () => void;
}

/**
 * Renders a row's actions as a single overflow menu.
 *
 * Only used when a row has more than one action. A row with exactly one action
 * is made clickable by its parent instead (see `.row-clickable` in styles.css),
 * and renders nothing here — that is why an actions column disappears entirely
 * on single-action lists.
 */
@Component({
  selector: 'app-row-actions',
  templateUrl: './row-actions.component.html',
  styleUrls: ['./row-actions.component.css'],
  imports: [MatIconModule, MatButtonModule, MatMenuModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RowActionsComponent {
  readonly actions = input.required<RowAction[]>();
  /** Names the row the menu belongs to, e.g. the username. */
  readonly forLabel = input<string>('');

  /**
   * The trigger sits inside rows that may themselves be clickable, so it has to
   * stop the click from reaching the row behind it.
   */
  onTriggerClick(event: Event): void {
    event.stopPropagation();
  }
}

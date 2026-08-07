import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Command, ShortcutService } from '../../../service/shortcut.service';

interface PaletteRow {
  command: Command;
  /** Group heading to render above this row, when it starts a new group. */
  groupKey?: string;
}

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.css'],
  imports: [MatIconModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'onKeydown($event)'
  }
})
export class CommandPaletteComponent {
  private readonly dialogRef = inject(MatDialogRef<CommandPaletteComponent>);
  private readonly shortcuts = inject(ShortcutService);
  private readonly translate = inject(TranslateService);

  readonly query = signal('');
  readonly activeIndex = signal(0);

  private readonly commands = this.shortcuts.availableCommands();

  readonly matches = computed<Command[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.commands;
    }
    return this.commands.filter(command => {
      const label = this.translate.instant(command.labelKey).toLowerCase();
      return label.includes(q) || command.keywords?.includes(q) || command.id.includes(q);
    });
  });

  /** Matches with a group heading attached to the first row of each group. */
  readonly rows = computed<PaletteRow[]>(() => {
    let lastGroup: string | null = null;
    return this.matches().map(command => {
      const groupKey = command.groupKey === lastGroup ? undefined : command.groupKey;
      lastGroup = command.groupKey;
      return { command, groupKey };
    });
  });

  onQueryChange(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.matches().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count) {
          this.activeIndex.set((this.activeIndex() + 1) % count);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) {
          this.activeIndex.set((this.activeIndex() - 1 + count) % count);
        }
        break;
      case 'Enter': {
        event.preventDefault();
        const command = this.matches()[this.activeIndex()];
        if (command) {
          this.run(command);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.dialogRef.close();
        break;
    }
  }

  run(command: Command): void {
    this.dialogRef.close();
    this.shortcuts.navigate(command.route);
  }

  isActive(command: Command): boolean {
    return this.matches()[this.activeIndex()]?.id === command.id;
  }
}

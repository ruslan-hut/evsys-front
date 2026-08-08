import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

import { RowAction, RowActionsComponent } from './row-actions.component';

describe('RowActionsComponent', () => {
  let fixture: ComponentFixture<RowActionsComponent>;

  function action(labelKey: string, extra: Partial<RowAction> = {}): RowAction {
    return { labelKey, icon: 'edit', run: vi.fn().mockName(labelKey), ...extra };
  }

  function setup(actions: RowAction[]): void {
    TestBed.configureTestingModule({
      imports: [RowActionsComponent, NoopAnimationsModule],
      providers: [provideTranslateService()]
    });

    fixture = TestBed.createComponent(RowActionsComponent);
    fixture.componentRef.setInput('actions', actions);
    fixture.componentRef.setInput('forLabel', 'row-1');
    fixture.detectChanges();
  }

  const trigger = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.row-actions-trigger');

  afterEach(() => TestBed.resetTestingModule());

  // The whole point of the pattern: a row with one action is clicked directly,
  // so this component must contribute nothing rather than a one-item menu.
  it('renders nothing for a single action', () => {
    setup([action('actions.view')]);
    expect(trigger()).toBeNull();
  });

  it('renders nothing for no actions', () => {
    setup([]);
    expect(trigger()).toBeNull();
  });

  it('renders an overflow trigger once there is more than one action', () => {
    setup([action('actions.edit'), action('actions.delete', { warn: true })]);
    expect(trigger()).not.toBeNull();
  });

  it('opens the menu and runs the chosen action', () => {
    const actions = [action('actions.edit'), action('actions.delete', { warn: true })];
    setup(actions);

    trigger()!.click();
    fixture.detectChanges();

    const items = document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item');
    expect(items.length).toBe(2);

    items[1].click();
    expect(actions[1].run).toHaveBeenCalledTimes(1);
    expect(actions[0].run).not.toHaveBeenCalled();
  });

  it('marks disabled actions as disabled', () => {
    setup([action('actions.edit'), action('actions.sendNow', { disabled: true })]);

    trigger()!.click();
    fixture.detectChanges();

    const items = document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item');
    expect(items[0].disabled).toBe(false);
    expect(items[1].disabled).toBe(true);
  });

  // Rows that carry a single action are clickable, and the trigger sits inside
  // them — without this the menu click would also fire the row's action.
  it('stops the trigger click from reaching the row behind it', () => {
    setup([action('actions.edit'), action('actions.delete')]);

    const rowClick = vi.fn().mockName('row click');
    fixture.nativeElement.parentElement!.addEventListener('click', rowClick);

    trigger()!.click();
    expect(rowClick).not.toHaveBeenCalled();
  });
});

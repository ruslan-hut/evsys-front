import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ShortcutService } from './shortcut.service';
import { AccountService } from './account.service';

/**
 * Builds a keydown event whose `target` is a real element, because the
 * text-entry guard inspects `target.tagName` and `isContentEditable`.
 */
function keydown(key: string, options: { target?: HTMLElement; meta?: boolean; ctrl?: boolean; alt?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    metaKey: options.meta ?? false,
    ctrlKey: options.ctrl ?? false,
    altKey: options.alt ?? false
  });
  Object.defineProperty(event, 'target', { value: options.target ?? document.body });
  return event;
}

describe('ShortcutService', () => {
  let service: ShortcutService;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let account: { isAdmin: boolean; isOperator: boolean };

  beforeEach(() => {
    navigateByUrl = vi.fn().mockName('navigateByUrl').mockResolvedValue(true);
    account = { isAdmin: true, isOperator: false };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigateByUrl } },
        { provide: AccountService, useValue: account }
      ]
    });
    service = TestBed.inject(ShortcutService);
  });

  afterEach(() => vi.useRealTimers());

  describe('command palette', () => {
    it('opens on cmd+k and ctrl+k', () => {
      const opened = vi.fn();
      service.paletteToggled$.subscribe(opened);

      expect(service.handleKeydown(keydown('k', { meta: true }))).toBe(true);
      expect(service.handleKeydown(keydown('k', { ctrl: true }))).toBe(true);
      expect(opened).toHaveBeenCalledTimes(2);
    });

    // The palette is the one shortcut that must work while typing, otherwise
    // it is unreachable from any screen with a focused filter.
    it('opens on cmd+k even from inside a text field', () => {
      const opened = vi.fn();
      service.paletteToggled$.subscribe(opened);

      expect(service.handleKeydown(keydown('k', { meta: true, target: document.createElement('input') }))).toBe(true);
      expect(opened).toHaveBeenCalledTimes(1);
    });
  });

  describe('text entry guard', () => {
    it.each(['INPUT', 'TEXTAREA', 'SELECT'])('ignores bare keys inside %s', tagName => {
      const focused = vi.fn();
      service.filterFocusRequested$.subscribe(focused);

      expect(service.handleKeydown(keydown('/', { target: document.createElement(tagName) }))).toBe(false);
      expect(focused).not.toHaveBeenCalled();
    });

    it('ignores bare keys inside a contenteditable element', () => {
      const editable = document.createElement('div');
      Object.defineProperty(editable, 'isContentEditable', { value: true });

      expect(service.handleKeydown(keydown('/', { target: editable }))).toBe(false);
    });

    it('ignores keys combined with alt', () => {
      expect(service.handleKeydown(keydown('g', { alt: true }))).toBe(false);
    });
  });

  describe('filter focus', () => {
    it('requests filter focus on /', () => {
      const focused = vi.fn();
      service.filterFocusRequested$.subscribe(focused);

      expect(service.handleKeydown(keydown('/'))).toBe(true);
      expect(focused).toHaveBeenCalledTimes(1);
    });
  });

  describe('g sequences', () => {
    it('navigates when g is followed by a mapped key', () => {
      expect(service.handleKeydown(keydown('g'))).toBe(true);
      expect(navigateByUrl).not.toHaveBeenCalled();

      expect(service.handleKeydown(keydown('p'))).toBe(true);
      expect(navigateByUrl).toHaveBeenCalledWith('/points');
    });

    it('swallows the second key but does not navigate when it is unmapped', () => {
      service.handleKeydown(keydown('g'));

      expect(service.handleKeydown(keydown('z'))).toBe(false);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    // Without the reset, a stray 'g' would silently arm navigation minutes later.
    it('forgets the pending g after the timeout', () => {
      vi.useFakeTimers();

      service.handleKeydown(keydown('g'));
      vi.advanceTimersByTime(1600);
      service.handleKeydown(keydown('p'));

      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('treats a second g as the start of a new sequence', () => {
      service.handleKeydown(keydown('g'));
      service.handleKeydown(keydown('g'));
      service.handleKeydown(keydown('t'));

      expect(navigateByUrl).toHaveBeenCalledExactlyOnceWith('/transactions');
    });

    it('does not start a sequence from inside a text field', () => {
      service.handleKeydown(keydown('g', { target: document.createElement('input') }));
      service.handleKeydown(keydown('p'));

      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('available commands', () => {
    it('lists every command for an admin', () => {
      expect(service.availableCommands().some(c => c.adminOnly)).toBe(true);
    });

    it('lists every command for an operator', () => {
      account.isAdmin = false;
      account.isOperator = true;

      expect(service.availableCommands().some(c => c.adminOnly)).toBe(true);
    });

    it('hides admin-only commands from a plain user', () => {
      account.isAdmin = false;
      account.isOperator = false;
      const commands = service.availableCommands();

      expect(commands.every(c => !c.adminOnly)).toBe(true);
      expect(commands.map(c => c.id)).toContain('points');
      expect(commands.map(c => c.id)).not.toContain('users');
    });
  });
});

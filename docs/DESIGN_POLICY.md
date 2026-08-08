# WattBrews Design Policy

Design standards for the WattBrews (EvSys Front) operator console.

**`src/styles.css` is the single source of truth.** Every value in this document
is transcribed from it. If the two ever disagree, the stylesheet is right and
this file is stale — fix it.

---

## Design Philosophy

This is a console for technicians and operators who keep it open all day, not a
marketing surface. The visual direction follows from that.

### Core Principles

1. **Density** — Fit more real information on screen. Whitespace is tuned for
   scanning rows of live data, not for editorial breathing room.
2. **Calm** — Colour carries meaning and nothing else. A screen with no problems
   on it should look quiet.
3. **Legibility** — Numbers align, timestamps are monospaced, labels stay out of
   the way of values.
4. **Consistency** — Same patterns, tokens and behaviours everywhere.
5. **Responsiveness** — Mobile-first, with desktop earning its extra width by
   showing more data rather than the same data larger.

### Visual identity

Slate/steel palette, IBM Plex Sans and IBM Plex Mono, tight spacing, small
radii, near-flat elevation, and a dark "console" header surface that stays dark
in both themes. Tabular numerals (`tnum`, `zero`) are on globally so meter
values, IDs and currency align in columns.

---

## Tokens

### Spacing

A 4px grid, exposed as numeric primitives with named aliases layered on top.
Prefer the named alias when one fits; reach for the primitive when it doesn't.

| Token | Value | | Alias | Resolves to |
|---|---|---|---|---|
| `--space-05` | 2px | | `--spacing-xs` | 4px |
| `--space-1` | 4px | | `--spacing-sm` | 8px |
| `--space-2` | 8px | | `--spacing-md` | 12px |
| `--space-3` | 12px | | `--spacing-lg` | 20px |
| `--space-4` | 16px | | `--spacing-xl` | 28px |
| `--space-5` | 20px | | | |
| `--space-6` | 24px | | | |
| `--space-7` | 28px | | | |
| `--space-8` | 32px | | | |

`--space-05` (2px) exists only for badge padding, which is sub-grid by design.

### Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 3px | Inline chips, tight markers |
| `--radius-sm` | 4px | Badges, small controls |
| `--radius-md` | 6px | Cards, panels, dialogs |
| `--radius-lg` | 8px | Large containers |
| `--radius-pill` | 999px | Pill-shaped chips |
| `--radius-circle` | 50% | Status dots, avatars |

`--card-border-radius` is an alias of `--radius-md`.

### Typography

| Token | Value | Usage |
|---|---|---|
| `--text-2xs` | 10px | Badges |
| `--text-xs` | 11px | Timestamps, meta |
| `--text-sm` | 12px | Labels, captions |
| `--text-md` | 13px | Secondary body |
| `--text-base` | 14px | Body (matches `body` font-size) |
| `--text-lg` | 16px | Subsection heading |
| `--text-xl` | 18px | Section heading |
| `--text-2xl` | 20px | Page title |
| `--text-3xl` | 24px | Connector number |
| `--text-4xl` | 28px | Hero metric |

| Token | Value |
|---|---|
| `--weight-regular` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--leading-tight` | 1.25 |
| `--leading-base` | 1.45 |
| `--leading-relaxed` | 1.6 |

**Families**

- `--font-sans` — IBM Plex Sans, Inter, system stack
- `--font-display` — IBM Plex Sans (headings; `letter-spacing: -0.01em`, weight 600)
- `--font-mono` — IBM Plex Mono, JetBrains Mono, SF Mono

Monospace is applied automatically to `.mono`, `code`, `kbd`, `samp`, `pre`,
`.cell-id`, `.timestamp`, `.meter-value`, `.currency`, `.numeric` and
`td.numeric`. Use those classes rather than setting `font-family` by hand.

### Icon sizes

Icon sizing is a separate scale from the type scale. Never size an icon with a
`--text-*` token.

| Token | Value |
|---|---|
| `--icon-xs` | 16px |
| `--icon-sm` | 18px |
| `--icon-md` | 20px |
| `--icon-lg` | 24px (Material default) |

### Motion

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 80ms | Press feedback |
| `--duration-fast` | 140ms | Hover, focus |
| `--duration-base` | 220ms | Most transitions |
| `--duration-slow` | 380ms | Entrances, state arrivals |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default |
| `--ease-emphasized` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Entrances |
| `--ease-exit` | `cubic-bezier(0.3, 0, 1, 1)` | Exits |

A global `prefers-reduced-motion: reduce` block collapses all animation and
transition durations to 1ms. Do not re-implement that per component.

### Layout

| Token | Value |
|---|---|
| `--card-margin` | 10px |
| `--header-height-mobile` | 52px |
| `--header-height-desktop` | 56px |
| `--touch-target-min` | 40px |
| `--elevation-1` | `0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)` |
| `--elevation-2` | `0 2px 4px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.06)` |

Breakpoint tokens (`--breakpoint-xs` 400px, `-sm` 600px, `-md` 900px, `-lg`
1200px) document the scale but cannot be used in media queries — CSS custom
properties don't work there. Write the px value and keep it in step with the
token.

---

## Colour

**Always use tokens. Never write a hex value in component CSS.** There are
currently zero hex literals outside `styles.css`; keep it that way.

### Light theme

| Purpose | Token | Value |
|---|---|---|
| Primary | `--color-primary` | `#1e3a8a` |
| Primary dark | `--color-primary-dark` | `#1e293b` |
| Accent | `--color-accent` | `#0284c7` |
| On primary | `--color-on-primary` | `#ffffff` |
| Text primary | `--color-text-primary` | `#0f172a` |
| Text secondary | `--color-text-secondary` | `#475569` |
| Text muted | `--color-text-muted` | `#64748b` |
| Border | `--color-border` | `#d4dae3` |
| Border light | `--color-border-light` | `#e8ecf2` |
| Background | `--color-background` | `#f1f4f8` |
| Background light | `--color-background-light` | `#f7f9fc` |
| Surface | `--color-surface` | `#ffffff` |
| Focus ring | `--color-focus-ring` | `rgba(2,132,199,.35)` |

### Status

| Purpose | Token | Light | Dark |
|---|---|---|---|
| Success / online | `--color-success`, `--color-online` | `#059669` | `#34d399` |
| Warning | `--color-warning` | `#d97706` | `#fbbf24` |
| Error | `--color-error` | `#dc2626` | `#f87171` |
| Offline / neutral | `--color-offline` | `#94a3b8` | `#64748b` |
| On error | `--color-on-error` | `#ffffff` | `#2e0a0a` |
| Error container | `--color-error-container` | `#fee2e2` | `#2e0a0a` |
| On error container | `--color-on-error-container` | `#991b1b` | `#fca5a5` |

### Badges and roles

| Purpose | Token | Light | Dark |
|---|---|---|---|
| Active bg / text | `--color-status-active-bg` / `-text` | `#dbeafe` / `#1e40af` | `#172554` / `#93c5fd` |
| Finished bg / text | `--color-status-finished-bg` / `-text` | `#d1fae5` / `#065f46` | `#064e3b` / `#6ee7b7` |
| Admin | `--color-role-admin` | `#b91c1c` | `#f87171` |
| Operator | `--color-role-operator` | `#1e40af` | `#60a5fa` |
| Other roles | `--color-role-default` | `#64748b` | `#94a3b8` |

### Connector status

| State | Foreground | Background |
|---|---|---|
| Available | `--color-connector-available` | `--color-connector-available-bg` |
| Occupied | `--color-connector-occupied` | `--color-connector-occupied-bg` |
| Charging | `--color-connector-charging` | `--color-connector-charging-bg` |
| Error | `--color-connector-error` | `--color-connector-error-bg` |

Use these for anything showing connector or charge point state. Do not invent
ad-hoc green/yellow/red classes.

### Action buttons

`--color-action` / `--color-action-hover` for standard actions,
`--color-action-warn` / `--color-action-warn-hover` for destructive ones.

### Header surface

The header is a dark console surface in both themes.

`--color-header-surface`, `--color-header-text`, `--color-header-text-muted`,
`--color-header-border`, `--color-header-accent`, `--color-header-accent-2`
(brand gradient second stop), `--color-header-on-accent`.

`ThemeService.applyTheme()` writes `--color-header-surface`'s value into the
`<meta name="theme-color">` tag. If you change that token, change the service
too — the values are duplicated by necessity.

---

## Dark Theme

Three modes: **auto** (follows the OS), **light**, **dark**. Managed by
`ThemeService`, persisted in `localStorage` under `theme-preference`, changed in
**User Profile > Appearance**.

### How it works

1. `ThemeService` resolves the mode to an effective theme and toggles a single
   `.dark-theme` class on `<html>`. `auto` is always resolved to an explicit
   class — it is never left to CSS.
2. An inline script in `index.html` applies the same class before first paint to
   prevent a flash of the wrong theme.
3. `.dark-theme` redefines the `--color-*` tokens. Nothing else.
4. `color-scheme` is set to `light` on `:root` and `dark` on `.dark-theme`, so
   native scrollbars, form controls and the like follow the theme for free.

### Developer notes

- Use `--color-*` tokens and dark theme works automatically. There is no reason
  to write a `.dark-theme` rule in a component stylesheet.
- The only `.dark-theme` descendant rules that remain in `styles.css` target
  ngx-charts (a third party that doesn't read our tokens) and bare native
  elements. Don't add more.

---

## Angular Material

The app uses the **modern token-based** prebuilt theme
(`@angular/material/prebuilt-themes/azure-blue.css`), not the legacy M2
`indigo-pink` theme.

`styles.css` contains a **Material System Token Bridge** section that maps
Material's `--mat-sys-*` system tokens onto our design tokens — colour, type
scale, corners and elevation. Because the bridge is declared once on `:root` and
its values are `var(--color-*)` references, it follows the active theme
automatically.

**This means you should not need per-component Material overrides.** If a
Material component looks wrong:

1. Find the `--mat-sys-*` token it reads.
2. Fix the mapping in the bridge.
3. Only if that genuinely can't express it, write a scoped override — and say
   why in a comment.

Adding a `--mdc-*` or `--mat-*` component-level override to a component
stylesheet is the thing this bridge exists to prevent.

---

## Component Patterns

### Lists

**Desktop — Material table**
- `mat-table` with `mat-sort` for sortable columns
- Wrap in `.table-responsive` for horizontal scroll
- Keep columns concise; tooltips for overflow text

**Mobile — expansion panels**
- `mat-accordion` with `mat-expansion-panel`
- Header: primary identifier + key value/badge
- Description: timestamp or secondary info
- Expanded: label/value detail rows
- Actions at the bottom, separated by a top border

**Common**
- Filter bar: `mat-form-field` with a clear button, above the list
- Add button: `mat-raised-button color="primary"` with icon
- Paginator below the list — mobile `[10, 25, 50]` without first/last, desktop
  `[10, 50, 100]` with them

### Row and card actions

**Rows and cards never show a strip of action buttons.** A row of four icon
buttons repeated down a table is most of the visual noise in a dense list, and
the icons are guesswork without tooltips. The rule is decided by how many
actions the row actually has:

| Actions | Treatment |
|---|---|
| 0 | Nothing. The row is inert. |
| 1 | The row or card itself is clickable and performs it. No button at all. |
| 2+ | A single `more_vert` overflow menu with labelled entries. |

Count the actions **for the current user** — role-gating changes the answer. The
charge point card is a menu for an admin, a single click target for a role with
one action, and inert for a plain user.

**Two or more — use `app-row-actions`:**

```html
<app-row-actions [actions]="actionsFor(row)" [forLabel]="row.username" />
```

```typescript
actionsFor(row: User): RowAction[] {
  return [
    { labelKey: 'actions.edit', icon: 'edit', run: () => this.edit(row) },
    { labelKey: 'actions.delete', icon: 'delete', warn: true, run: () => this.delete(row) }
  ];
}
```

Labels come from the shared `actions.*` i18n group and stay short — the row is
already the context, so "Edit", not "Edit user {{username}}". Destructive
entries set `warn: true` and go last. The component renders nothing when given
one action or none, which is what makes the single-action case fall through to
a clickable row.

**Exactly one — make the row clickable:**

```html
<tr mat-row *matRowDef="let row; columns: displayedColumns"
    class="row-clickable"
    tabindex="0"
    (click)="viewDetails(row.id)"
    (keydown.enter)="onRowActivate($event, row.id)"
    (keydown.space)="onRowActivate($event, row.id)"></tr>
```

Drop `'actions'` from `displayedColumns` — the column has nothing left in it.

Rules for clickable rows:

- Always pair the click with `tabindex="0"` and Enter/Space handlers. A click
  target that the keyboard can't reach is not an action, it's a trap.
- `.row-clickable` supplies the hover and focus treatment. Don't hand-roll it.
- **Anything interactive nested inside must call `stopPropagation()`**, or it
  fires the row action too. `app-row-actions` does this on its trigger;
  `connector.component.ts` does it in `openInfo()`.
- An expansion panel header already uses its click to expand. Put the clickable
  target on the panel body instead, with a visible affordance — see
  `.transaction-open` in `transactions-list`.

**Status is not an action.** An icon that reports a state belongs next to the
data it describes, not in an actions column. The transaction retry marker sits
beside the transaction id as a plain `mat-icon` with a tooltip.

`.list-action-btn` remains only for card-level actions that aren't row actions,
such as a panel's refresh button. **Do not** use `color="warn"` on icon buttons
in lists — too aggressive.

### Filter clear buttons

Use `.filter-clear-btn` on the `matSuffix` clear button for a muted appearance.

### Cards

- `mat-card` for detail views and forms
- Margin `var(--card-margin)` (10px), radius `var(--card-border-radius)` (6px)
- Cards get a 1px `--color-border-light` border and `--elevation-1` globally —
  don't add your own border or shadow
- `mat-divider` to separate sections within a card

### Forms

- `appearance="outline"` on form fields
- Group related fields under headings
- Submit `mat-raised-button color="primary"`, cancel `mat-button`
- Actions at the bottom, right-aligned
- Layout helpers: `.form-grid`, `.form-row`, `.form-row--inline`,
  `.form-row-two-col`

### Dialogs

- One task per dialog
- `mat-dialog-title` / `mat-dialog-content` / `mat-dialog-actions`
- Destructive confirmations: explicit warning text, red confirm button
- Cancel left, confirm right

### Connector rail

The rail is the app's signature element and the densest thing on screen, so it
has its own rules.

A charge point's connectors render as fixed-width slots in a single row
(`.connector-rail` on the card, `app-connector` per slot). It scrolls
horizontally with snap points when there are more connectors than fit.

- **Status is carried by the top bar and the status word, never by a background
  wash.** A card with six connectors must read as one calm object; down a list
  of forty charge points, only the bars should differ. This is why the slot
  keeps a plain surface background.
- Each status class sets `--slot-accent` and everything else derives from it.
  Adding a status means adding one class with one custom property.
- Readings are monospace with `tnum`/`zero` so numbers line up down the rail.
- Slots are a fixed size, and the list's skeleton block matches that geometry
  so nothing resizes when data lands.
- **Charging is the only animated state in the app.** A session is genuinely in
  progress, so the bar shows energy moving. Every other state is still. Don't
  add a second animated state without a comparably good reason.
- Use standard `scrollbar-width` / `scrollbar-color` rather than `::-webkit-`
  rules — they follow the theme through `color-scheme`.

### Badges

```css
.status-badge {
  display: inline-block;
  padding: var(--space-05) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
}
```

---

## Motion

Motion in this app has one job: tell the operator something changed. Data
arrives over a WebSocket without them asking for it, so a state change that
repaints silently is a change they can miss.

### Global utilities

| Class | Use |
|---|---|
| `.interactive-surface` | Hover/press feedback on clickable cards and rows. Lifts shadow on hover, presses 1px on active. |
| `.state-changed` | Apply briefly when live data changes an item. Fades a ring out over `--duration-slow`. |
| `.skeleton-line`, `.skeleton-block` | Loading placeholders (see above). |

### Rules

1. Every clickable surface gets hover and press feedback. A click with no
   response reads as a broken click.
2. Transition the properties that carry state — `background-color`,
   `border-color`, `color` — so a status change is visible as a change rather
   than an instant repaint.
3. Live updates get `.state-changed`. The animation must finish on its own; do
   not leave a permanent "new" marker that needs dismissing.
4. Use the `--duration-*` and `--ease-*` tokens. Don't write raw ms values.
5. Never animate anything that isn't communicating something. Decorative motion
   is the fastest way to make a dense console feel unreliable.
6. Reduced motion is handled globally — don't re-implement it per component.

### Live state pattern

Components receiving live data derive a *state key* and flag a change when it
moves. See `chargepoint.component.ts` for the reference implementation:

```typescript
effect(() => {
  const key = this.stateKey(this.chargepoint());
  const previous = this.lastStateKey;
  this.lastStateKey = key;
  if (previous === null || previous === key) return;   // first render is not a change
  this.stateChanged.set(true);
  this.resetTimer = setTimeout(() => this.stateChanged.set(false), 1200);
});
```

---

## Keyboard

This is a console people keep open all day. Keyboard access is a primary
interface, not an accessibility afterthought.

| Key | Action |
|---|---|
| `Cmd/Ctrl + K` | Open the command palette |
| `?` | Open the command palette (its footer lists the shortcuts) |
| `/` | Focus the current page's filter input |
| `g` `p` | Charge points |
| `g` `t` | Transactions |
| `g` `d` | Dashboard |
| `g` `u` | Users |
| `g` `l` | System log |
| `g` `r` | Reports |

### Implementation

`ShortcutService` owns the key handling and the command registry.
`AppComponent` binds `(document:keydown)` and delegates to it.

- Bare-key shortcuts are suppressed while focus is in an `input`, `textarea`,
  `select` or contenteditable. `Cmd/Ctrl + K` is the deliberate exception — the
  palette must be reachable from a focused filter.
- A page that has a filter subscribes to `filterFocusRequested$` and focuses its
  input. Adding a filter to a screen means wiring this up too.
- New destinations go in the `COMMANDS` array in `shortcut.service.ts` with a
  `groupKey` and, if they deserve one, a `hint`. Admin-only entries set
  `adminOnly: true` and are filtered by role.
- The palette is discoverable through the header's search button, which shows
  the platform-correct shortcut. A shortcut nobody can find doesn't exist.

---

## Responsive Design

| Name | Width | Layout |
|---|---|---|
| Mobile | < 600px | Single column, accordion lists |
| Tablet portrait | 600–899px | Transitional |
| Tablet landscape | 900–1199px | Two column where useful |
| Desktop | ≥ 1200px | Full tables |

```typescript
isMobile$ = this.breakpointObserver
  .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
  .pipe(map(result => result.matches));
```

Utilities: `.hide-mobile`, `.hide-desktop`.

---

## Icons

Material Icons, used consistently:

| Action | Icon | | Action | Icon |
|---|---|---|---|---|
| Add | `add` | | Settings | `settings` |
| Edit | `edit` | | Menu | `menu` |
| Delete | `delete` | | User | `person` |
| View | `visibility` | | Transactions | `receipt_long` |
| Back | `arrow_back` | | Tags | `local_offer` |
| Search | `search` | | Charge points | `ev_station` |
| Clear | `close` | | Copy | `content_copy` |
| Filter | `filter_list` | | | |

---

## Loading and Empty States

### Loading

**Lists load with skeleton rows.** A list knows the shape of what's coming, so
it should hold that shape instead of collapsing and letting content jump in.
Compose the global `.skeleton-line` (text) and `.skeleton-block` (chips,
thumbnails) primitives into a placeholder that mirrors the real row's geometry —
see `chargepoint-list` for the reference implementation.

```html
@if (loading()) {
  <div class="cp-skeleton-list" aria-busy="true">
    @for (row of skeletonRows; track row) {
      <div class="cp-skeleton-card">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line"></div>
      </div>
    }
  </div>
}
```

**Everything else uses an indeterminate progress bar** as the first element of
the component:

```html
@if (loading) {
  <div><mat-progress-bar mode="indeterminate" /></div>
}
```

**Do not** use `mat-spinner` for page or component loading — spinners are for
inline micro-interactions only. Two components still violate this
(`chargepoint-profile`, `chargepoint-config`); they are known debt, not
precedent.

### Empty states

```html
<div class="no-data">No charge points match this filter</div>
```

Say what is empty and, where there's an action available, what to do about it.

---

## Accessibility

1. Visible focus ring on every interactive element — `:focus-visible` is styled
   globally with a 2px `--color-primary` outline at 2px offset
2. Contrast: 4.5:1 normal text, 3:1 large text
3. Touch targets at least `--touch-target-min` (40px); use `.touch-target`
4. `aria-label` on every icon-only button
5. `.sr-only` for screen-reader-only context

---

## CSS Architecture

### Files

- `src/styles.css` — tokens, the Material bridge, utilities, global rules
- `<component>.component.css` — scoped component styles

### Naming

Lowercase with hyphens, prefixed with component context, BEM-ish:
`.user-panel`, `.user-panel-title`, `.user-panel.expanded`.

### Rules

- No hex values outside `styles.css`
- No raw px for spacing, radius, type or icon size where a token exists
- No `.dark-theme` rules in component stylesheets
- No `--mdc-*` / `--mat-*` overrides in component stylesheets — fix the bridge

### `!important`

Only to override Material internals, or on a global utility class that must
always win. Every other use is a specificity bug.

### Known exceptions

A handful of off-grid one-off values survive in component CSS — layout offsets
(44px, 64px, 72px, 80px, 100px) and micro-padding (3px, 5px, 6px, 10px). They
are deliberate one-offs, not a second scale. Don't copy them into new code, and
don't add more.

---

## Anti-Patterns

1. **Heavy borders** — use the global card border and elevation
2. **Multiple font weights on one line**
3. **Colour without meaning** — colour signals state, nothing else
4. **Ad-hoc status colours** — use the connector/status tokens
5. **Inconsistent button styles**
6. **Custom scrollbars** — except a thin standard-property scrollbar on a
   deliberately horizontally-scrolling strip (see `.connector-rail`). Never
   `::-webkit-scrollbar`.
7. **Animation for its own sake** — motion should signal that something changed
8. **All-caps or italics for body text** — uppercase is for badges only

---

## Checklist for New Components

- [ ] Tokens for colour, spacing, radius, type and icon size — no raw values
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] Mobile and desktop layouts where applicable
- [ ] Row actions follow the count rule: 1 → clickable row, 2+ → `app-row-actions`
- [ ] Clickable rows are keyboard reachable, and nested controls stop propagation
- [ ] `aria-label` on icon-only buttons
- [ ] Empty state handled and worded usefully — and offers a way out when a
      filter caused it
- [ ] Loading uses skeleton rows (lists) or `mat-progress-bar` (everything else)
- [ ] Clickable surfaces carry `.interactive-surface` or their own hover/press
      feedback
- [ ] Live-updating items flag changes with `.state-changed`
- [ ] A filterable screen subscribes to `filterFocusRequested$` for `/`
- [ ] No `.dark-theme` or `--mat-*` overrides in the component stylesheet
- [ ] Verified in both themes
- [ ] Verified at a mobile viewport

---

## Reference Implementations

- **List with filters**: `transactions-list.component`
- **Mobile accordion**: `users.component`
- **Detail view**: `transaction-detail.component`
- **Edit form**: `user-edit.component`

---

*Last updated: August 2026 — rewritten against `src/styles.css` after the
design-token and Material-theme migration.*

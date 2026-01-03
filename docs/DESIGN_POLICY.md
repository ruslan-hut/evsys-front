# WattBrews Design Policy

This document defines the design principles, patterns, and standards for the WattBrews (EvSys Front) application. All UI development should adhere to these guidelines to maintain a consistent, clean, and professional interface.

## Design Philosophy

### Core Principles

1. **Minimalism** - Every element must serve a purpose. Remove visual noise and unnecessary decorations.
2. **Clarity** - Information hierarchy should be immediately apparent. Users should understand the interface without explanation.
3. **Consistency** - Same patterns, colors, and behaviors across all components.
4. **Responsiveness** - Mobile-first approach with graceful desktop enhancements.

### Visual Goals

- Clean, uncluttered layouts with generous whitespace
- Subtle visual hierarchy through typography and spacing (not heavy borders or backgrounds)
- Muted color palette with strategic accent colors for important actions
- Professional appearance suitable for enterprise/industrial applications

---

## Color Palette

**IMPORTANT:** Always use CSS custom properties (variables) instead of hardcoded hex values. All color variables are defined in `src/styles.css`.

### Primary Colors

| Purpose | CSS Variable | Hex | Usage |
|---------|--------------|-----|-------|
| Primary | `--color-primary` | `#3f51b5` | Primary actions, links, focus states |
| Primary Dark | `--color-primary-dark` | `#303f9f` | Hover states for primary elements |
| Accent | `--color-accent` | `#1976d2` | Highlighted values, important data |

### Text Colors

| Purpose | CSS Variable | Hex | Usage |
|---------|--------------|-----|-------|
| Text Primary | `--color-text-primary` | `#212121` | Main content text |
| Text Secondary | `--color-text-secondary` | `#616161` | Secondary text, labels |
| Text Muted | `--color-text-muted` | `#757575` | Placeholder text, descriptions |

### Border & Background Colors

| Purpose | CSS Variable | Hex | Usage |
|---------|--------------|-----|-------|
| Border | `--color-border` | `#e0e0e0` | Dividers, card borders |
| Border Light | `--color-border-light` | `#f0f0f0` | Subtle dividers |
| Background | `--color-background` | `#f5f5f5` | Page background |
| Background Light | `--color-background-light` | `#fafafa` | Alternate backgrounds |
| Surface | `--color-surface` | `#ffffff` | Cards, panels, dialogs |

### Action Button Colors

| Purpose | CSS Variable | Hex | Usage |
|---------|--------------|-----|-------|
| Action Default | `--color-action` | `#616161` | List action buttons (edit, view) |
| Action Hover | `--color-action-hover` | `#424242` | Hover state for action buttons |
| Destructive | `--color-action-warn` | `#c62828` | Delete buttons |
| Destructive Hover | `--color-action-warn-hover` | `#b71c1c` | Hover state for delete |

### Status Colors

| Status | CSS Variable | Hex | Usage |
|--------|--------------|-----|-------|
| Success/Online | `--color-success` / `--color-online` | `#4caf50` | Success states, online indicators |
| Warning | `--color-warning` | `#ff9800` | Warning states |
| Error/Offline | `--color-error` | `#f44336` | Error states, offline indicators |
| Neutral/Inactive | `--color-offline` | `#9e9e9e` | Inactive, disabled states |

### Status Badge Colors

| Purpose | CSS Variable | Hex | Usage |
|---------|--------------|-----|-------|
| Active Background | `--color-status-active-bg` | `#e3f2fd` | Active status badge background |
| Active Text | `--color-status-active-text` | `#1565c0` | Active status badge text |
| Finished Background | `--color-status-finished-bg` | `#e8f5e9` | Finished status badge background |
| Finished Text | `--color-status-finished-text` | `#2e7d32` | Finished status badge text |

### Role Badge Colors

| Role | CSS Variable | Hex | Usage |
|------|--------------|-----|-------|
| Admin | `--color-role-admin` | `#d32f2f` | Administrator badge |
| Operator | `--color-role-operator` | `#1976d2` | Operator badge |
| Default | `--color-role-default` | `#757575` | Other roles |

---

## Typography

### Font Family

- **Primary**: Roboto, "Helvetica Neue", sans-serif
- **Monospace**: For code, IDs, technical values (system default)

### Font Sizes

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Page Title | 24px | 500 | Main page headers |
| Section Title | 18px | 500 | Card headers, section titles |
| Subsection | 16px | 500 | Subsection headers |
| Body | 14px | 400 | Default text |
| Small | 13px | 400 | Secondary information |
| Caption | 12px | 400 | Labels, captions |
| Micro | 11px | 400 | Timestamps, meta info |
| Badge | 10px | 600 | Role badges, status chips |

### Text Colors by Context

- **Primary identifiers** (usernames, IDs): `#1976d2` with weight 600
- **Labels**: `#757575` with weight 400
- **Values**: `#212121` with weight 500
- **Descriptions/Meta**: `#757575` with weight 400

---

## Spacing System

Use CSS custom properties defined in `styles.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing, badge padding |
| `--spacing-sm` | 8px | Default gap, small padding |
| `--spacing-md` | 16px | Container padding, section gaps |
| `--spacing-lg` | 24px | Large section spacing |
| `--spacing-xl` | 32px | Page-level spacing |

### Spacing Guidelines

- **Mobile container padding**: `var(--spacing-sm)` (8px)
- **Desktop container padding**: `var(--spacing-md)` (16px)
- **Between form fields**: `var(--spacing-md)` (16px)
- **Between list items**: 2px (tight) or `var(--spacing-sm)` (8px)
- **Action button gaps**: 4-8px

---

## Component Patterns

### Lists (Tables & Accordions)

#### Desktop: Material Table

- Use `mat-table` with `mat-sort` for sortable columns
- Wrap in `.table-responsive` for horizontal scroll on small screens
- Add `.mat-elevation-z8` for subtle shadow
- Keep columns concise; use tooltips for overflow text

#### Mobile: Expansion Panels

- Use `mat-accordion` with `mat-expansion-panel`
- Panel header shows: Primary identifier + key value/badge
- Panel description shows: Timestamp or secondary info
- Expanded content: Detail rows with label-value pairs
- Actions at bottom with top border separator

#### Common Elements

- **Filter bar**: `mat-form-field` with clear button, positioned above list
- **Add button**: `mat-raised-button color="primary"` with icon
- **Pagination**: `mat-paginator` below list
  - Mobile: `[10, 25, 50]` options, no first/last buttons
  - Desktop: `[10, 50, 100]` options, with first/last buttons

### Action Buttons

Use the global `.list-action-btn` class for consistent styling:

```html
<!-- Standard action -->
<button mat-icon-button class="list-action-btn" (click)="action()">
  <mat-icon>edit</mat-icon>
</button>

<!-- Destructive action -->
<button mat-icon-button class="list-action-btn warn" (click)="delete()">
  <mat-icon>delete</mat-icon>
</button>
```

**Do NOT use** `color="warn"` on icon buttons in lists - it's too aggressive. Use `.list-action-btn warn` instead.

### Filter Clear Buttons

Use the global `.filter-clear-btn` class for filter input clear buttons:

```html
<mat-form-field appearance="fill" class="filter-field">
  <mat-label>Filter</mat-label>
  <input matInput [(ngModel)]="filter" />
  @if (filter) {
    <button matSuffix mat-icon-button class="filter-clear-btn" aria-label="Clear" (click)="clearFilter()">
      <mat-icon>close</mat-icon>
    </button>
  }
</mat-form-field>
```

This provides a muted, non-distracting appearance for filter clear buttons.

### Cards

- Use `mat-card` for detail views and forms
- Standard margin: `var(--card-margin)` (16px)
- Border radius: `var(--card-border-radius)` (8px)
- Use `mat-card-header` with `mat-card-title` for headers
- Use `mat-divider` to separate sections within cards

### Forms

- Use `appearance="outline"` for form fields
- Group related fields in sections with headings
- Submit button: `mat-raised-button color="primary"`
- Cancel/Back button: `mat-button` (text button)
- Place actions at bottom, right-aligned

### Dialogs

- Keep dialogs focused on single task
- Use `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`
- Destructive confirmation: Clear warning text, red confirm button
- Actions: Cancel (left), Confirm (right)

### Status Indicators

#### Badges

```css
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
```

#### Online/Offline Dots

Use CSS classes `.status-online` and `.status-offline` with appropriate icons.

---

## Responsive Design

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 600px | Single column, accordion lists |
| Tablet Portrait | 600-899px | Transitional layouts |
| Tablet Landscape | 900-1199px | Two-column where appropriate |
| Desktop | >= 1200px | Full table layouts, sidebars |

### Mobile-First Patterns

1. **Lists**: Accordion on mobile, table on desktop
2. **Filters**: Collapsible panel on mobile, inline on desktop
3. **Navigation**: Bottom sheet or hamburger menu on mobile
4. **Touch targets**: Minimum 44px for interactive elements

### Using BreakpointObserver

```typescript
isMobile$ = this.breakpointObserver
  .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
  .pipe(map(result => result.matches));
```

```html
@if (isMobile$ | async) {
  <!-- Mobile layout -->
} @else {
  <!-- Desktop layout -->
}
```

---

## Icons

Use Material Icons consistently:

| Action | Icon | Usage |
|--------|------|-------|
| Add | `add` | Create new item |
| Edit | `edit` | Modify item |
| Delete | `delete` | Remove item |
| View | `visibility` | View details |
| Back | `arrow_back` | Navigate back |
| Search | `search` | Search/filter |
| Clear | `close` | Clear input/filter |
| Filter | `filter_list` | Filter panel toggle |
| Copy | `content_copy` | Copy to clipboard |
| Settings | `settings` | Configuration |
| Menu | `menu` | Navigation menu |
| User | `person` | User-related |
| Transactions | `receipt_long` | Transaction list |
| Tags | `local_offer` | User tags |

---

## Loading States

### Progress Indicators

**IMPORTANT:** Always use horizontal progress bar (`mat-progress-bar`) for page/component loading states. This provides a consistent, unobtrusive loading experience across the application.

#### Standard Loading Pattern

```html
@if (loading) {
  <div><mat-progress-bar mode="indeterminate"></mat-progress-bar></div>
}

<div class="component-content">
  <!-- Component content here -->
</div>
```

#### Rules

1. **Page/Component load**: Always use `mat-progress-bar mode="indeterminate"` at the top of the component
2. **Position**: Progress bar should be the first element, above all other content
3. **Wrapper**: Wrap in a `<div>` to ensure proper block display
4. **DO NOT use** `mat-spinner` for page loading - spinners are only for inline micro-interactions
5. **Button actions**: Disable the button during action, no spinner needed if page has progress bar

#### Examples

**Correct - Horizontal progress bar:**
```html
@if (loading) {
  <div><mat-progress-bar mode="indeterminate"></mat-progress-bar></div>
}
```

**Incorrect - Do not use spinners for page loading:**
```html
<!-- WRONG: Don't use mat-spinner for page loading -->
@if (loading) {
  <mat-spinner diameter="30"></mat-spinner>
}
```

### Empty States

```html
<div class="no-data">No items found</div>
```

Style: Centered, muted text, italic, generous padding.

---

## Accessibility

### Requirements

1. **Focus indicators**: Visible focus ring on all interactive elements
2. **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
3. **Touch targets**: Minimum 44x44px
4. **ARIA labels**: On icon-only buttons
5. **Screen reader text**: Use `.sr-only` class for context

### Focus Styles

```css
:focus-visible {
  outline: 2px solid #3f51b5;
  outline-offset: 2px;
}
```

### Button Labels

Always include `aria-label` on icon buttons:

```html
<button mat-icon-button aria-label="Edit user John">
  <mat-icon>edit</mat-icon>
</button>
```

---

## CSS Architecture

### File Organization

- **Global styles**: `src/styles.css` - Variables, utility classes, global overrides
- **Component styles**: `component-name.component.css` - Scoped component styles

### Naming Conventions

- Use lowercase with hyphens: `.user-panel-title`
- Prefix with component context: `.transaction-details`, `.tag-actions`
- Use BEM-like structure for related elements:
  - `.user-panel` (block)
  - `.user-panel-title` (element)
  - `.user-panel.expanded` (modifier)

### CSS Custom Properties

Always use design tokens from `:root`:

```css
/* Good */
padding: var(--spacing-md);
color: var(--color-error);

/* Avoid */
padding: 16px;
color: #f44336;
```

### Avoiding !important

Only use `!important` when:
1. Overriding Material component internal styles
2. Global utility classes that must always apply

---

## Anti-Patterns (What NOT to Do)

1. **Heavy borders** - Use subtle shadows or background differences instead
2. **Multiple font weights on same line** - Keep typography simple
3. **Bright colors for non-critical elements** - Reserve color for meaning
4. **Dense layouts without breathing room** - Maintain generous whitespace
5. **Inconsistent button styles** - Always use established patterns
6. **Custom scrollbars** - Use native scrolling behavior
7. **Animations for everything** - Keep motion subtle and purposeful
8. **All-caps for body text** - Reserve uppercase for badges/labels only

---

## Checklist for New Components

Before submitting a new component:

- [ ] Uses CSS custom properties for spacing and colors
- [ ] Has both mobile and desktop layouts (if applicable)
- [ ] Action buttons use `.list-action-btn` class
- [ ] Icon buttons have `aria-label` attributes
- [ ] Empty states are handled gracefully
- [ ] Loading states show progress indicator
- [ ] Follows established naming conventions
- [ ] No hardcoded colors or spacing values
- [ ] Touch targets are minimum 44px
- [ ] Component is tested on mobile viewport

---

## Reference Implementations

Refer to these components as examples of proper implementation:

- **List with filters**: `transactions-list.component`
- **Mobile accordion pattern**: `users.component`
- **Detail view**: `transaction-detail.component`
- **Edit form**: `user-edit.component`

---

*Last updated: January 2026*

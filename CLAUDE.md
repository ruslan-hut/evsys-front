# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EvSys Front (WattBrews) is an Angular 21.0.6 standalone components application for managing electric vehicle charging infrastructure. It uses Firebase + custom API backend with real-time WebSocket communication.

## Common Commands

```bash
npm start          # Dev server on localhost:4200
npm run build      # Production build (output: dist/evsys-front/)
npm test           # Unit tests via Karma
npm run watch      # Development build with watch mode
```

To run a single test file, use: `ng test --include=**/component-name.spec.ts`

## Architecture

### State Management
RxJS-based with BehaviorSubjects in services — **legacy pattern, not signals**. No NgRx/Akita. New code in this repo can stay with this pattern unless the user asks for a migration.
- `AccountService` - User state via `BehaviorSubject<User>` exposed as `user$`
- `ChargepointService` - Charge points list with real-time WebSocket updates
- `WebsocketService` - Real-time bidirectional communication with auto-reconnect

### Authentication
Dual auth system (Firebase + local API):
- Tokens stored in localStorage
- `TokenInterceptor` adds `Authorization: Bearer {token}` to API requests
- Skip interceptor with `skip-interceptor: true` header
- `authGuard` protects admin/operator routes

### Key Services
- `AccountService` - Auth, user state, role checking
- `ChargepointService` - Charge point CRUD and state
- `WebsocketService` - WebSocket with auto-reconnect (5s retry, 30s ping)
- `CSService` - Charge station protocol operations
- `ErrorService` - Global error handling with snackbar notifications

### Component Organization
```
src/app/
├── components/     # 54 feature components
├── service/        # 17 business logic services
├── models/         # 30 TypeScript interfaces
├── helpers/        # Auth guard, token/error interceptors
└── pipes/          # Custom data transformation pipes
```

### Routing
Lazy-loaded routes defined in `app.routes.ts`. Protected routes require `authGuard` (admin/operator role).

### Styling
- Angular Material with `indigo-pink` prebuilt theme
- Component-level CSS files (not SCSS)
- Responsive design using `@angular/cdk/layout` Breakpoints
- Global styles in `src/styles.css`
- **Design standards**: See [Design Policy](docs/DESIGN_POLICY.md) for colors, spacing, component patterns

## Environment Configuration

Environment files in `src/environments/`:
- `environment.ts` - Production (debug: false)
- `environment.development.ts` - Development (debug: true)

Both use `https://wattbrews.me/api/v1` API and `wss://wattbrews.me/ws` WebSocket.

## Related Repositories

| Repository | Local path | Role |
|---|---|---|
| evsys-back | `~/projects/evsys-back` | API and WebSocket server powering this frontend |
| evsys | `~/projects/evsys` | OCPP central system; original source of charge point and transaction data |
| Wattbrews | `~/projects/Wattbrews` | Android app on the same API |
| wattbrews-web | `~/projects/wattbrews-web` | Second Angular web app on the same API |

This app is **not the only client** of evsys-back. Wattbrews (Android) and
wattbrews-web call the same endpoints, and the Android app ships through the
Play Store where old versions stay in use. A change needing a different
response shape has to be made additively in the backend - never by editing an
existing shape.

Data flows evsys -> MongoDB -> evsys-back -> here, and the models are
hand-copied at each hop. A field present in the database is not necessarily
declared in `~/projects/evsys-back/entity/`, and one declared there is not
necessarily sent by the endpoint this app calls - the transaction detail
endpoint returns the `ChargeState` DTO rather than the full transaction. When a
value renders empty, check each hop before assuming the frontend is at fault.

### Environment files

`src/environments/environment.development.ts` is gitignored because it carries
real Firebase credentials. Copy it from `environment.development.example.ts`
and keep its keys in step with `environment.ts` - both files must satisfy the
same shape, so a key present in one and missing from the other fails the build
with TS2339.

## PWA Support

Service Worker enabled in production via `ngsw-config.json`. App shell prefetched, assets lazy-loaded.

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to wattbrews.me on push to master.

## Documentation

- [Design Policy](docs/DESIGN_POLICY.md) - UI/UX standards, color palette, component patterns, accessibility guidelines

## Claude Code Preferences

- Do not run builds (`npm run build`) - user will run builds manually

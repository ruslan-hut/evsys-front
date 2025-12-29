# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EvSys Front (WattBrews) is an Angular 21 standalone components application for managing electric vehicle charging infrastructure. It uses Firebase + custom API backend with real-time WebSocket communication.

## Common Commands

```bash
npm start          # Dev server on localhost:4200
npm run build      # Production build (output: dist/evsys-front/)
npm test           # Unit tests via Karma
npm run watch      # Development build with watch mode
```

To run a single test file, use: `ng test --include=**/component-name.spec.ts`

## Architecture

### Standalone Components Pattern
All components use Angular standalone pattern (no NgModules). Components import their dependencies directly:
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, ...]
})
```

### State Management
RxJS-based with BehaviorSubjects in services - no NgRx/Akita:
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
├── components/     # 39 feature components
├── service/        # 13 business logic services
├── models/         # 26 TypeScript interfaces
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

## Environment Configuration

Environment files in `src/environments/`:
- `environment.ts` - Production (debug: false)
- `environment.development.ts` - Development (debug: true)

Both use `https://wattbrews.me/api/v1` API and `wss://wattbrews.me/ws` WebSocket.

## PWA Support

Service Worker enabled in production via `ngsw-config.json`. App shell prefetched, assets lazy-loaded.

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to wattbrews.me on push to master.

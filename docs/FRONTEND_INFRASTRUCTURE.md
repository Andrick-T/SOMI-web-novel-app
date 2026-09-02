# Frontend Infrastructure

## Application

SOMI is implemented as a Vite React app with route-based navigation, credential-aware auth guards, workspace-specific layouts, and a mock-domain service layer. The app intentionally keeps the existing product design while adding production-grade infrastructure around it.

## Router

The router is defined in the app shell and relies on route guards for writer and admin access. Public routes remain accessible without authentication while protected routes redirect to the auth flow or unauthorized page when necessary.

## Error Boundary

The app shell is wrapped in an `ErrorBoundary` that catches unexpected render-time failures and shows branded recovery UI with a `Try again` action.

## Theme

Reader themes, light/dark/sepia states, and typography remain in the existing layered CSS architecture. Focus visible states and reduced motion checks are added globally to keep the app accessible without redesigning the product.

## PWA

A manifest is served from the public folder, and a minimal service worker caches the application shell and static assets. This supports installability and app-like shell behavior without over-caching dynamic content.

## Offline Layer

The offline architecture uses a small local abstraction with IndexedDB as the canonical storage for cached chapter content. LocalStorage is used only for small UI state or metadata, while chapter content is stored in IndexedDB to avoid the storage limits of localStorage.

## Feature Modules

Existing feature modules such as reader, economy, writer, and admin continue to model domain logic. Offline and network abstractions are added without breaking the mock-data architecture.

## Domain Services

The app still uses the mock repository/service structure. This phase stops before real API integration and keeps the current repository pattern intact.

## What runs offline

- Cached chapter content for local reading
- Offline status banner
- Local reading progress metadata
- Save/remove offline actions

## What requires network

- Real backend data fetches (not present in this phase)
- Auth verification in a live server environment
- Payment or entitlement syncing (future backend work)

## What is cached

- Shell assets
- Static icons and manifest metadata
- App HTML and static content

## What is intentionally not cached

- Sensitive account data
- Wallet balances as authoritative source of truth
- Private admin and writer workflows
- Real backend responses without a defined server contract

## Metadata generation

Metadata is centralized in a small `Metadata` component that updates document `title`, canonical URLs, description, and Open Graph tags based on the current route.

## Environment configuration

Environment values are centralized in `src/config/env.ts` and use Vite-safe `VITE_*` keys. This avoids scattering `import.meta.env` checks through the app.

## Route-level code splitting

Large page modules are lazy-loaded using `React.lazy` and `Suspense`, prioritizing the reader, writer, and admin route sets without over-splitting tiny shared components.

## Error recovery

The error boundary resets state and retries the rendered subtree. The app avoids blank screens and provides users a way back into the experience without needing a browser reload.

## Accessibility

The app keeps a visible focus ring, respects reduced motion preferences, adds semantic keyboard interactions for route-critical controls, and avoids nested interactive elements that break screen-reader and browser-conformance expectations.

## Backend dependency boundary

This phase is intentionally frontend-only. Real API calls, payments, auth verification, and live server entitlements remain out of scope until Phase 7.

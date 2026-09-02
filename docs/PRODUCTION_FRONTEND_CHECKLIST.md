# Production Frontend Checklist

## PWA

- Manifest present and valid
- Icons exist for the app shell
- Service worker registered with a conservative app-shell cache
- Installability supported via manifest metadata
- Scope and start URL configured for the application root

## Offline

- IndexedDB-backed offline storage exists for chapter snapshots
- Offline reader status is tracked separately from network connectivity
- Read-later model supports saving and deleting cached content
- Local-only sync foundation documents when backend integration is required

## SEO

- Title and description metadata are set centrally
- Canonical URLs are generated per route
- Open Graph metadata is included for public pages
- Robots file excludes private app areas
- Sitemap is provided for public pages only

## Accessibility

- Semantic interactive elements are preferred over generic divs
- Keyboard focus states are visible across the app
- Reduced-motion support is enabled globally
- Reader controls remain keyboard reachable
- Form and dialog flows remain discoverable and operable

## Performance

- Route-level lazy loading is applied to large route modules
- Suspense loading states preserve the SOMI visual language
- Images use accessible alt text and responsive sizes
- Fonts are kept to the design system with reduced unnecessary loading

## Reliability

- Error boundary wraps the app shell
- Loading and empty states are handled intentionally
- Retry flow available on unexpected UI errors
- Network status is surfaced without crashing offline workflows

## Environment

- Vite variables are centralized in a frontend-safe config object
- Development and production defaults are normalized through env config
- Sensitive values are not stored in frontend environment variables

## Verification

- npm run dev
- npm run build
- npx vitest run

# SOMI Authentication

The API exposes authentication under `/api/v1/auth`.

## Flow

`register` and `login` return a short-lived bearer access token and set a refresh token in an HttpOnly cookie. The server stores only an HMAC hash of the refresh token in `AuthSession`. Refresh rotates the session token and revokes the previous session. Logout revokes the current session. Password changes revoke all sessions for the user.

## Endpoints

- `POST /register`: `{ email, password, name }`
- `POST /login`: `{ email, password }`
- `POST /refresh`: uses the HttpOnly cookie
- `POST /logout`: revokes the current cookie session
- `GET /me`: requires `Authorization: Bearer <access-token>`
- `POST /change-password`: requires the bearer token and `{ currentPassword, newPassword }`

## Configuration

Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in the backend environment. Production must provide both secrets. Optional settings are `ACCESS_TOKEN_TTL_MINUTES`, `REFRESH_TOKEN_TTL_DAYS`, `AUTH_COOKIE_NAME`, and `CORS_ORIGIN`.

The frontend API repository is enabled with `VITE_USE_API_AUTH=true` and uses `VITE_API_BASE_URL`. Without that flag, the existing mock authentication remains active for prototype development and tests.

## Authorization

Roles are read from the server-side `User.role` value. Backend middleware provides `requireAuth`, `requireRole`, and `requirePermission`; frontend route guards are only a user-experience layer. Resource ownership checks should be added by future resource modules using the authenticated request principal, never a trusted owner id from the client.

Authentication errors use the existing `{ success: false, error: { code, message, details } }` contract. Login and duplicate-registration failures intentionally avoid revealing whether an email exists.
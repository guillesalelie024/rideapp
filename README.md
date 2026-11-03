# RIDE

RIDE (Real-time Itinerary and Destination Explorer) is an Ionic Vue app for exploring Calapan City, planning itineraries, comparing published fare references, and running live trips. A small Express + PostgreSQL API provides optional accounts, trip sync, and password recovery.

## Requirements

- Node.js 22+
- npm
- Docker Desktop (for local PostgreSQL)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env`.
3. `npm run db:up`
4. `npm run api` (terminal 1)
5. `npm run dev` (terminal 2)

Open the Vite URL (normally `http://localhost:5173`). The Vite dev server proxies `/api` to `http://localhost:3001`. Check the API with `http://localhost:3001/api/health`.

When changing the API port, update both `API_PORT` and `vite.config.ts`. For a separate hosted API, set `VITE_API_BASE_URL` (for example `https://api.example.com/api`) and add the app origin to `ALLOWED_ORIGINS`.

The API creates its tables on startup. See `DATABASE_SETUP.md` for database details.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used only by the API. |
| `PGSSLMODE` | Set `require` for hosted providers that require TLS. |
| `API_PORT` | Express port, default `3001`. |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call the API. |
| `APP_ORIGIN` | Public app origin used to build password reset links. |
| `RESEND_API_KEY` | Optional Resend API key for password reset email. |
| `RESET_FROM_EMAIL` | Verified sender address for reset email. |
| `VITE_API_BASE_URL` | Optional client API base override; blank uses `/api`. |

In production, set `RESEND_API_KEY` and `RESET_FROM_EMAIL` so reset emails are delivered. Without them, the API logs a configuration error and does not send email. Development without them logs the reset link and returns `devResetUrl`.

Never expose `DATABASE_URL`, `RESEND_API_KEY`, or other server secrets through `VITE_` variables. `.env` is ignored by git; `.env.example` is safe to commit.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run api` | Start the Express API. |
| `npm run db:up` / `db:down` | Start or stop local PostgreSQL. |
| `npm run typecheck` | Run `vue-tsc --noEmit`. |
| `npm run lint` | Run ESLint. |
| `npm run test:unit` | Run Vitest unit tests. |
| `npm run test:e2e` | Run Cypress end-to-end tests. |
| `npm run build` | Type-check and build for production. |

## Android

The Capacitor Android project is in `android/`. Location and notification permissions are declared in `android/app/src/main/AndroidManifest.xml`. Run `npx cap sync android` after changing web assets or Capacitor plugins.

## Data and privacy

Trips, itineraries, saved places, preferences, and sessions are stored locally first. Signed-in users can sync trips through the API. Passwords are salted and hashed server-side; sessions expire after 14 days. Near Me and live tracking request location only when used, and coordinates stay on the device. See the in-app Terms and Privacy pages for details.

Destination names, photos, and fare references are informational. Verify opening hours, prices, and transport details directly before traveling.

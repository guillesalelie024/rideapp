# RIDE PostgreSQL setup

RIDE now has a PostgreSQL API for accounts and trip records. The browser never connects directly to PostgreSQL; it calls the API, which validates the session and accesses the database.

## Local development

1. Start Docker Desktop and wait until its engine is running.
2. Copy `.env.example` to `.env` in the project folder. The included connection string is only for the local Docker database.
3. Run `npm run db:up` to start PostgreSQL. The API creates its tables when it starts.
4. In one terminal run `npm run api`.
5. In another terminal run `npm run dev` and open the Vite URL.

Check `http://localhost:3001/api/health`; it should return `{"ok":true,"database":"connected"}`.

## Data behavior

- Account passwords are salted and hashed by the API. Raw passwords are not stored.
- Account sessions are revocable and expire after 14 days.
- Trips save locally first and sync to that signed-in account. Signing in also uploads trips already stored on the device.
- If the API or database is offline, local trip use continues; the Trips page reports when account sync is unavailable.
- Logging out revokes the session and clears the signed-in trip cache from that device. The account's server copy remains available on next sign-in.
- Password reset links are single-use, expire after 30 minutes, and revoke the account's active sessions. Password changes also sign out other sessions. Configure `RESEND_API_KEY`, `RESET_FROM_EMAIL`, and `APP_ORIGIN` to deliver reset email.
- This development setup does not provide profile photos or production hosting/security configuration.

For a hosted PostgreSQL server, configure its connection string in `.env`, set `PGSSLMODE=require` when required by the provider, and set `ALLOWED_ORIGINS` to the deployed app origin. Never put `DATABASE_URL` in a `VITE_` variable or commit `.env`.

## Existing databases

The API creates missing tables on startup, including `ride_password_resets`. If your database uses restricted migrations instead of startup table creation, apply `server/schema.sql` before enabling password reset.

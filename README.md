# bro-trips · frontend

Vite + React + TypeScript SPA for the bro-trips carpool app.
Users sign in with email+password or Google, register cars, post trips,
and book seats on other people's trips.

Backend repo: see the sibling `bro-trips-backend` repo.

## Tech

- React 18 + TypeScript, Vite 5
- `react-router-dom` for client routing
- `@react-oauth/google` for the Google sign-in button
- Plain `fetch` for API calls (auth token cached in `localStorage`)

## Local development

### 1. Configure env

```sh
cp .env.example .env
# edit .env:
# VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

If you skip Google OAuth setup, the app still works via the Register /
Sign in tabs on the login screen. The Google button will appear but click
attempts will fail until the backend has `GOOGLE_CLIENT_ID` set and the
client ID's Authorized JavaScript origins include this frontend's origin.

### 2. Install and run

```sh
npm install
npm run dev          # vite dev server on :5173
```

`vite.config.ts` proxies `/api/*` to `http://localhost:4000`, so the
backend can be on the default port with no extra config.

Open <http://localhost:5173>.

## Pages

| Route        | Purpose |
|--------------|---------|
| `/login`     | Email+password tabs (Sign in / Register) and Google sign-in. |
| `/`          | Upcoming trips. Driver sees passengers + cancel; passenger sees book / cancel-my-booking. |
| `/trips/new` | Post a trip (pick car, addresses, departure, free seats). |
| `/cars`      | Add / remove your cars. |
| `/bookings`  | Trips the caller has booked. |

## Project layout

```
src/
├── main.tsx                # entry; mounts providers (Google, Router, Auth)
├── App.tsx                 # routes + top nav
├── api.ts                  # fetch wrapper, token storage, shared types
├── auth.tsx                # AuthProvider context + useAuth hook
├── styles.css              # plain CSS, no framework
├── vite-env.d.ts           # typing for import.meta.env.VITE_*
└── pages/
    ├── Login.tsx
    ├── Trips.tsx
    ├── NewTrip.tsx
    ├── Cars.tsx
    └── Bookings.tsx
```

## Talking to the backend

- Dev: `vite.config.ts` proxies `/api` → `http://localhost:4000`.
- Prod: serve the built `dist/` from any static host. Either
  (a) put the API behind the same origin under `/api`, or
  (b) point the static host at the API with an env-driven base URL.
  Today `src/api.ts` always calls `/api/...` — to use a non-same-origin
  API, edit that one place (e.g. read `import.meta.env.VITE_API_URL`).

## Build

```sh
npm run build        # tsc + vite build → dist/
npm run preview      # serve the production build locally
```

## Deployment notes

- The build is a static `dist/` — any static host works (S3 + CloudFront,
  Netlify, Vercel, nginx, Caddy, a PaaS that serves static files, etc.).
- For Google sign-in in production, add the deployed frontend origin to
  the OAuth client's Authorized JavaScript origins in Google Cloud Console.
- `VITE_GOOGLE_CLIENT_ID` is baked into the bundle at build time — set it
  in the build environment, not at runtime.

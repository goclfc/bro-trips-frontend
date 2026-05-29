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

- Dev: `vite.config.ts` proxies `/api` → `http://localhost:4000`, so leave
  `VITE_API_URL` unset.
- Same-origin prod: leave `VITE_API_URL` unset and have your reverse proxy
  forward `/api/*` to the backend.
- Different-origin prod: set `VITE_API_URL=https://api.example.com`. The
  backend must allow your frontend origin via its `CORS_ORIGIN` env.

## Build

```sh
npm run build        # tsc + vite build → dist/
npm run preview      # serve the production build locally
```

## Deployment notes

### Docker

A multi-stage `Dockerfile` is included: build the React app with Node, then
serve the resulting `dist/` from nginx with SPA fallback configured in
`nginx.conf` (any unknown path returns `index.html` so React Router takes
over).

Because Vite bakes env vars into the bundle **at build time**, pass them as
Docker build args:

```sh
docker build \
  --build-arg VITE_API_URL=https://api.your-host.example \
  --build-arg VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com \
  -t brotrips-frontend .

docker run --rm -p 8080:80 brotrips-frontend
```

On PaaS targets (Coolify, Dokploy, Railway, Fly, Render, etc.) that auto-detect
the Dockerfile, set the same names as **build args** (not just runtime env) in
the service settings.

### Without Docker

The build is a static `dist/` — any static host works (S3 + CloudFront,
Netlify, Vercel, nginx, Caddy, a PaaS that serves static files, etc.).

```sh
VITE_API_URL=https://api.your-host.example \
VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com \
npm run build
```

### Google OAuth in production

Add the deployed frontend origin (e.g. `https://app.your-host.example`) to
the OAuth client's **Authorized JavaScript origins** in Google Cloud Console.

### Graceful degradation

If `VITE_GOOGLE_CLIENT_ID` is missing at build time, the app still loads —
the Google button is just hidden and users can sign in with email + password.

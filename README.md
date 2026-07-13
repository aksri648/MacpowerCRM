# MacpowerCRM

Sales CRM for lead capture and conversion tracking. React + Capacitor client (web and Android), backed by a Cloudflare Worker API on a Cloudflare D1 database, with automatic one-way sync to Google Sheets as a backup/mirror.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Clients                               │
│  ┌────────────────────────┐   ┌───────────────────────────┐  │
│  │  Web (Cloudflare Pages) │   │  Android APK (Capacitor)   │  │
│  │  React 19 + Vite SPA    │   │  React SPA + Geolocation   │  │
│  └────────────┬────────────┘   └─────────────┬─────────────┘  │
└───────────────┼──────────────────────────────┼───────────────┘
                │            HTTPS (?action=...) │
                └───────────────┬────────────────┘
                                ▼
              ┌─────────────────────────────────────┐
              │   Cloudflare Worker (REST API)      │
              │   macpower-crm-api.*.workers.dev    │
              │   - CRUD + search + dashboard       │
              │   - Cron (*/1 min) → sync to Sheets │
              └───────────────┬─────────────────────┘
                              │ SQL
                              ▼
              ┌─────────────────────────────────────┐
              │   Cloudflare D1 (SQLite)            │
              │   macpower-crm-db · leads table     │
              └───────────────┬─────────────────────┘
                              │ cron sync (unsynced rows)
                              ▼
              ┌─────────────────────────────────────┐
              │   Google Apps Script → Google Sheets│
              │   (downstream backup / mirror)      │
              └─────────────────────────────────────┘
```

D1 is the system of record. The worker's scheduled cron trigger pushes any rows with `synced = 0` to Google Sheets via the Apps Script web app, so Sheets acts as a human-readable mirror rather than the primary store.

## Repository Layout

```
MacpowerCRM/
├── worker/
│   ├── index.js              # Cloudflare Worker API + cron sync handler
│   └── schema.sql            # D1 schema (leads table + indexes)
├── wrangler.toml             # Worker config: D1 binding, vars, cron trigger
├── frontend-react/           # React 19 + Vite SPA (web + Android via Capacitor)
│   ├── src/
│   │   ├── api.js            # API client (?action= calls to the Worker)
│   │   ├── pages/            # Dashboard, Leads, AddLead, Enquiries, Conversions, Settings
│   │   └── components/
│   ├── capacitor.config.json # Capacitor app config (appId com.macpower.crm)
│   └── android/              # Generated Android project (Capacitor)
├── .github/workflows/
│   └── android-build.yml     # CI: build + release Android APK on tag push
├── apps_script/
│   └── Code.gs               # Google Apps Script (Sheets sync target)
└── frontend/                 # Legacy static vanilla-JS client (superseded by frontend-react)
```

## API

The Worker exposes a single endpoint driven by an `action` query parameter. All responses are JSON `{ success, ... }` and CORS is open (`*`).

| Action | Params | Description |
|---|---|---|
| `getDashboard` | — | Stat counts (leads/enquiries/conversions), conversion rate, 5 recent leads |
| `getLeads` | `status?` | List leads, optionally filtered by status |
| `getLead` | `id` | Fetch a single lead |
| `addLead` | `companyName, contactPerson, phone, area, machineModel, price, latitude, longitude, locationAddress, notes` | Create a lead (status `New Lead`) |
| `updateLead` | `leadId` + any updatable field | Partial update of a lead |
| `deleteLead` | `leadId` | Delete a lead |
| `convertLead` | `leadId` | Mark a lead as `Converted` |
| `searchLeads` | `query` | Search company/contact/area/machine model |

Lead lifecycle statuses: `New Lead` → `Enquiry` → `Converted`. Any write sets `synced = 0` so the cron job re-syncs it to Sheets.

## Backend Setup (Cloudflare Worker + D1)

```bash
# Install Wrangler
npm install -g wrangler
wrangler login

# Create the D1 database (update database_id in wrangler.toml with the output)
wrangler d1 create macpower-crm-db

# Apply the schema
wrangler d1 execute macpower-crm-db --file=worker/schema.sql

# Deploy the Worker
wrangler deploy
```

Config lives in `wrangler.toml`:
- `[[d1_databases]]` binds `DB` to `macpower-crm-db`
- `[vars] APPS_SCRIPT_URL` points at the Google Apps Script web app used for sync
- `[triggers] crons = ["*/1 * * * *"]` runs the Sheets sync every minute

## Frontend Setup (Web)

```bash
cd frontend-react
npm install
npm run dev          # local dev server

# Production build against the deployed API
VITE_API_URL=https://macpower-crm-api.akshatsri648.workers.dev npx vite build
```

Deploy the built `dist/` to Cloudflare Pages:

```bash
npx wrangler pages deploy dist --project-name=macpower-crm
```

The API base URL is read from `VITE_API_URL` at build time (`src/api.js`).

## Android App (Capacitor)

```bash
cd frontend-react

# Build the web assets and sync into the Android project
npm run build:android      # sets VITE_API_URL, runs vite build + cap sync android

# Open in Android Studio (optional)
npx cap open android

# Or build a debug APK from the CLI
cd android && ./gradlew assembleDebug
```

Requirements: JDK 21 (Capacitor 8 compiles against Java 21), Android SDK, Gradle 8.14.x (via the wrapper). The app id is `com.macpower.crm` and it uses the Geolocation plugin for GPS capture on leads.

## CI/CD — Android Release

`.github/workflows/android-build.yml` builds and publishes the Android APK. It triggers on pushing a `v*` tag (or manual `workflow_dispatch`) and:

1. Sets up Node 22 and JDK 21 (Temurin) + Android SDK
2. Installs deps, builds the React app with the production `VITE_API_URL`
3. Runs `npx cap sync android` and `./gradlew assembleDebug`
4. Uploads the APK as an artifact, and on a `v*` tag creates a GitHub Release with the APK attached

To cut a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Features

- Dashboard with real-time lead/enquiry/conversion stats and conversion rate
- Lead management: add, edit, delete, search, and convert
- GPS location capture (latitude/longitude/address) for field leads
- Enquiries and Conversions views by status
- Web (Cloudflare Pages) and native Android (Capacitor) from one codebase
- Automatic backup mirror to Google Sheets via scheduled sync

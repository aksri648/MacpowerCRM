# MacpowerCRM

Sales CRM with Google Apps Script backend + Cloudflare Pages frontend.

## Architecture

```
┌─────────────────────────────────────────────────┐
│        Cloudflare Pages (Static Frontend)       │
│     Dashboard + Forms + Lead Management UI      │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS API
                        ▼
┌─────────────────────────────────────────────────┐
│           Google Apps Script (Backend)          │
│              REST API Endpoint                  │
└───────────────────────┬─────────────────────────┘
                        │ Read/Write
                        ▼
┌─────────────────────────────────────────────────┐
│              Google Sheets (Database)           │
└─────────────────────────────────────────────────┘
```

## Deploy to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from frontend directory
cd frontend
wrangler pages deploy . --project-name=macpower-crm
```

Or connect your GitHub repo at https://dash.cloudflare.com/pages

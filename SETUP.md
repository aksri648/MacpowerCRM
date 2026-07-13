# MacpowerCRM - Setup Guide

## Project Structure

```
MacpowerCRM/
├── apps_script/
│   └── Code.gs              # Google Apps Script backend
└── frontend/                # Deploy THIS folder to Cloudflare Pages
    ├── index.html
    ├── styles.css
    └── app.js
```

## Step 1: Create Google Sheet

1. Go to https://sheets.google.com
2. Create new spreadsheet: "MacpowerCRM Database"
3. Copy spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[YOUR_SHEET_ID]/edit
   ```

## Step 2: Setup Google Apps Script

1. Go to https://script.google.com
2. Click "New Project"
3. Delete default code → Paste `apps_script/Code.gs`
4. Replace `YOUR_SPREADSHEET_ID_HERE` with your sheet ID
5. Save (Ctrl+S)

## Step 3: Deploy Apps Script

1. Click "Deploy" → "New deployment"
2. Gear icon → "Web app"
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click "Deploy"
5. **Copy the Web App URL**

## Step 4: Deploy to Cloudflare Pages

### Option A: Direct Upload (Quick)
```bash
cd MacpowerCRM/frontend
npx wrangler pages deploy . --project-name=macpower-crm
```

### Option B: Git Integration (Recommended)
1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/you/MacpowerCRM.git
   git push -u origin main
   ```
2. Go to https://dash.cloudflare.com/pages
3. Click "Create a project" → "Connect to Git"
4. Select your repo
5. Settings:
   - Build command: (leave empty)
   - Build output directory: `frontend`
6. Click "Save and Deploy"

## Step 5: Connect Frontend to Backend

1. Open your Cloudflare Pages URL
2. Enter Apps Script URL when prompted
3. Done!

## Features

- Dashboard with real-time stats
- Add/Edit/Delete leads
- Auto GPS location capture
- Material Design UI
- Mobile-friendly
- Works offline (localStorage fallback)

## Custom Domain (Optional)

1. Go to Cloudflare Pages → Your project
2. Click "Custom domains"
3. Add your domain
4. Update DNS as instructed

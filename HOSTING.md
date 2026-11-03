# Hosting on Hostinger (Node.js Web App)

This is a Next.js 14 app. It runs on any Node.js host; the database and photo
storage live in Supabase, so nothing else needs to move.

## Hostinger settings

hPanel → Websites → Add website → **Node.js Web App** → connect GitHub repo
`asifpxpryk/jallundhar-sweets-website`.

| Setting          | Value           |
| ---------------- | --------------- |
| Framework        | Next.js         |
| Node version     | 20 or 22        |
| Branch           | `master`        |
| Install command  | `npm ci`        |
| Build command    | `npm run build` |
| Start command    | `npm start`     |

## Environment variables

Copy these from the old Vercel project (Settings → Environment Variables).
They must be present **before** the build, because pages read the catalog from
Supabase while building.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `ADMIN_PIN`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `SITE_VERSION` (optional)

## Domain

Add `jallundharmain.com` and `www.jallundharmain.com` to the Hostinger site,
then set the DNS records Hostinger shows at the domain registrar. Remove both
domains from the old Vercel project first.

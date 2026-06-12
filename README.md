# GlobalComix Panel Tracker

## Run locally

Vite loads `.env.local` automatically for `npm run dev` and `npm run build`.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Fill these frontend variables in `.env.local`:

```sh
VITE_APP_NAME="GlobalComix Panel Tracker"
VITE_LOGIN_ALIASES="admin=admin@example.com"
VITE_STORAGE_PREFIX="globalcomix_panel_tracker"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

`VITE_LOGIN_ALIASES` is optional. Use it for simple username shortcuts, for example `admin=sgsanimation.studio@gmail.com`. Multiple aliases can be separated with commas.

Only use `VITE_` for values that are safe to expose in the browser. Keep service-role keys, R2 access keys, and other secrets out of `.env.local` for the frontend.

## Supabase Edge Functions

For local Edge Function development, keep server-only values in `supabase/.env.local`:

```sh
cp supabase/.env.example supabase/.env.local
supabase functions serve --env-file supabase/.env.local
```

If you copied values from `supabase secrets list`, note that the long hex strings shown there are digests, not the original secret values. Use the real values from Supabase/Cloudflare when filling `supabase/.env.local`.

For deployed functions, set the same server-only variables as Supabase secrets:

```sh
supabase secrets set APP_SUPABASE_SERVICE_ROLE_KEY="..."
supabase secrets set R2_ACCOUNT_ID="..."
supabase secrets set R2_ENDPOINT="..."
supabase secrets set R2_ACCESS_KEY_ID="..."
supabase secrets set R2_SECRET_ACCESS_KEY="..."
supabase secrets set R2_BUCKET="..."
```

`R2_ENDPOINT` should be a full URL like `https://<account-id>.r2.cloudflarestorage.com`. If you only set `R2_ACCOUNT_ID`, the Edge Functions will build that endpoint automatically.

The frontend config is centralized in `src/lib/env.js`; update that file when adding new `VITE_` variables.

## Deploy Frontend To Vercel

Vercel should deploy only the Vite frontend. Add these Environment Variables in Vercel Project Settings:

```sh
VITE_APP_NAME="GlobalComix Panel Tracker"
VITE_LOGIN_ALIASES="admin=sgsanimation.studio@gmail.com"
VITE_STORAGE_PREFIX="globalcomix_panel_tracker"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

Do not add `APP_SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCESS_KEY_ID`, or `R2_SECRET_ACCESS_KEY` to Vercel for this frontend-only deployment. Those belong in Supabase secrets for Edge Functions.

Recommended Vercel settings:

```sh
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

This repo includes `vercel.json` with those defaults and an SPA rewrite to `index.html`.

Before relying on account creation or R2 uploads in production, deploy the Supabase Edge Functions too:

```sh
npx supabase functions deploy admin-create-user --project-ref your-project-ref
npx supabase functions deploy resolve-login --project-ref your-project-ref
npx supabase functions deploy upload-asset --project-ref your-project-ref
npx supabase functions deploy create-r2-upload-url --project-ref your-project-ref
npx supabase functions deploy finalize-asset-upload --project-ref your-project-ref
npx supabase functions deploy create-r2-read-url --project-ref your-project-ref
```

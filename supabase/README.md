# Enable private accounts and automatic sync

The app stays usable in device-only mode until these steps are completed. No database password or service-role key belongs in the browser, Vercel's `VITE_` variables, or GitHub.

## 1. Create the Supabase project

1. Visit https://supabase.com/dashboard and sign in with GitHub.
2. Create a Free organization and a project named `gatime`.
3. Generate a database password and keep it privately. Choose a nearby region.
4. Wait for the project to finish provisioning.

## 2. Create the recipe tables

1. Open the project's **SQL Editor** and start a new query.
2. Open `setup.sql` in this folder on GitHub, then click **Raw** and copy its contents.
3. Paste the SQL into Supabase and click **Run**. The script is safe to run again.

The script adds private recipe tables, read policies that enforce account ownership, and a write function that checks ownership and recipe versions. Direct client writes are denied. Deleted recipes retain tombstones to protect against stale offline edits. Requests have durable acknowledgements so a lost response cannot duplicate an edit.

## 3. Allow the deployed app to sign in

In **Authentication → URL Configuration**:

- Set **Site URL** to `https://gatime-beryl.vercel.app`.
- Add `https://gatime-beryl.vercel.app` to **Redirect URLs**.
- For local development, optionally add `http://localhost:5173`.

The app uses email sign-in links. Email authentication and new-user signup must be enabled. Supabase's built-in email sender has strict limits and normally permits only project team email addresses. For other users, configure custom SMTP in Authentication settings; do not put SMTP credentials in the frontend. No email is sent by installation or tests.

## 4. Connect Vercel

Find your **Project URL** in the project's Connect dialog or **Project Settings → Data API**. Find your **Publishable key** in **Project Settings → API Keys**. It starts with `sb_publishable_`; the older public `anon` key is also supported. These are public frontend configuration. Never use the `secret` or `service_role` key.

In Vercel, open **gatime → Settings → Environment Variables** and add:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Publishable key |

Select Production for both variables. Add Preview separately only if previews should use this same database. Save, then redeploy the latest deployment. Vite embeds these variables at build time, so changing them requires a rebuild.

For local development, copy `.env.example` to `.env.local`, fill in the public values, and restart Vite. Allow your exact `<project>.supabase.co` hostname in the cloud environment's network settings for live testing. Keep other existing domains.

## 5. Use and verify

1. Open the app and click **Your kitchen** at the bottom of the sidebar (on phones, open ☰ first).
2. Enter your email, request a sign-in link, and open the email link on that same device.
3. Existing device-only recipes are kept separately. Use **Add this device's recipes**, then confirm **Add recipes to my account** to copy them into your account. Repeat on other devices to collect their existing recipes. Already-known recipe IDs are skipped, including deleted ones; Export/Import can copy a recipe you deliberately want to recreate.
4. Sign in using the same email on your second device.
5. Add a recipe on device A, wait for **Synced across your devices**, and confirm it appears on B. Sync runs about every 15 seconds while the app is open, and on focus or reconnection; **Sync now** is available in the account panel.
6. Edit while offline, reconnect, and check the change arrives. If the same recipe changed elsewhere, choose which version to keep; no edit is silently discarded.
7. Sign in with another email and confirm it cannot see the first account's recipes. The SQL tests also exercise this isolation.

Recipe caches and pending edits are separate for each account. Signing out returns to the separate device-only collection and keeps pending account edits for the next sign-in. Web Locks serialize browser storage operations between app windows when supported (including Android Chrome). Email delivery, actual Supabase access, and production syncing must be tested against the user's configured project; automated browser tests use a mock service.

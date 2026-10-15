# Google sign-in setup

The app now offers Google OAuth alongside email magic links. Google sign-in does not require SMTP or a purchased domain. The browser/TWA uses a **Web application** OAuth client through Supabase; no Google client secret belongs in Vercel, the frontend or the Android project.

## Supabase and Google Cloud

1. Supabase → Gatime → Authentication → Sign In / Providers → Google. Copy the exact **Callback URL (for OAuth)** shown by Supabase (usually `https://<project-ref>.supabase.co/auth/v1/callback`). Keep this page open.
2. Google Cloud Console → create/select a dedicated project for Gatime. Open Google Auth Platform (or APIs & Services → OAuth consent screen in the older layout).
3. Configure Branding: app name Gatime, support email learn.grow.makeit@gmail.com, developer contact, home URL `https://gatime-beryl.vercel.app`, privacy URL `https://gatime-beryl.vercel.app/privacy.html`. Follow Google's domain/brand verification requirements if requested; never claim ownership of vercel.app or supabase.co generally.
4. Audience: **External** so accounts outside your own organization can use it. While status is Testing, add the exact test users. Before public launch, follow the Console's **Publish app / In production** flow; Testing alone does not allow everyone. Configure only basic OpenID, email and profile data. No Gmail mailbox, Drive or Contacts access is needed. Verification requirements depend on Google's displayed scopes/branding rules.
5. Clients → Create client → **Web application** → name Gatime Web. Authorized JavaScript origin: `https://gatime-beryl.vercel.app` (no path). Authorized redirect URI: the exact Supabase callback copied in step 1. The Google callback is not the Vercel homepage.
6. Copy Client ID and Client secret directly into the Google provider fields in Supabase, enable the Google provider and save. Keep the client secret private; do not send it in chat, commit it or put it in Vercel public variables. Leave nonce/security checks enabled.
7. Supabase → Authentication → URL Configuration: Site URL `https://gatime-beryl.vercel.app`. Add redirect URL `https://gatime-beryl.vercel.app/?account=1` used by the app. Keep existing valid email redirect URLs; avoid wildcarding arbitrary domains. If testing a preview deployment, add only its exact origin/return URL.
8. Authentication → Sign In / Providers: confirm new user signup is enabled for public use. Use suitable rate limits and Supabase abuse controls.

## Test before opening to everyone

Deploy the new frontend, update the installed app, and use a separate browser/private window with a non-owner Google test user. Choose Continue with Google, check the requested permissions, choose an account and confirm return to Gatime with the correct email. Add a test recipe, verify another device with that same account sees it, and ensure a different Google account cannot see it. Guest data must remain separate until explicit import. Test cancel/retry, offline, sign-out, Play-installed browser routing and account deletion. For an existing email-link user signing in with the same Google email, verify the resulting Supabase user ID/recipes; do not assume a new or linked identity without checking the actual provider behavior.

Google sign-in remains unverified against live Google/Supabase until these external settings and real sign-in tests complete. A frontend build or mocked redirect is not proof the provider is enabled. Default Supabase email delivery limits still apply to the separate email-link option; Google sign-in bypasses the need for that email delivery.

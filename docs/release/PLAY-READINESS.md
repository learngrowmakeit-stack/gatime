# Gatime — release preparation, 15 October 2026

Public developer label: Gatime. Contact: learn.grow.makeit@gmail.com. Hosting: https://gatime-beryl.vercel.app. Same Play Console account as MyOrganizer; separate listing, application ID, version codes and signing setup.

## Implemented and validated locally

- Private per-account recipe storage, owner-only RLS and guarded/versioned writes.
- Guest copies remain separate and require explicit import. Automated sync tests cover offline edits, retries, account isolation and conflicts.
- Self-service account deletion endpoint verifies the authenticated user at Supabase, matches the typed email and deletes only that identity through the Admin API. Database foreign keys cascade both recipes and mutation acknowledgements. Local cleanup preserves guest recipes and other accounts.
- Translation is now off by default, with disclosure of the recipe text sent to Gemini before enabling it.
- Public `/privacy.html` and `/delete-account.html` pages, linked in the app, in Albanian, German and English; external account-deletion requests can be sent to the support email. The owner must monitor that mailbox and verify requests.
- Reproducible Android TWA source, local artwork, proposed package `app.gatime.recipes`, no release key or signed bundle.

## Must complete before public release

1. Set `SUPABASE_SERVICE_ROLE_KEY` as a **server-only Secret in Vercel Production**, using the project's legacy service_role key. Never prefix it with VITE_, commit it, send it in chat or put it into Android source. Existing public Supabase variables are reused. Redeploy. No new SQL migration is required for cascade deletion with the existing schema.
2. On a disposable test account, exercise email sign-in, sync from two physical devices, photo upload, export/import, conflict resolution and account deletion. Verify both tables are empty for the deleted user. Never use the owner's real recipe account for deletion tests. Confirm sign-in email delivery for external addresses: configure Supabase production SMTP, Site URL and redirect allowlist, suitable quotas and abuse controls. Development email restrictions must be removed before public signup.
3. Review Supabase, Vercel and Gemini quotas/retention and service agreements. The translation limiter is per server instance and is not a durable global quota. Decide on provider billing/data handling for public recipe text (Gemini free-tier terms may permit product improvement use). Verify a real provider request on test data, set budgets/quotas and monitor failures. Recipe text may contain personal data. Confirm legal controller identity and policies before release.
4. Build signed Android AAB, configure Play App Signing and Digital Asset Links, and test the Play-installed app. Android source has not been compiled or run on a device yet. See `android/README.md` for exact remaining build prerequisites.
5. Prepare real phone screenshots, 1024×500 feature graphic, store description, category Food & Drink, support contact, content rating and target audience declarations. Review all bundled/external photo and font licenses/attribution. Sample nutrition and recipe content are illustrative; do not claim automatic nutrition calculation, background alarms or cloud sync of weekly plans/shopping lists.
6. Complete Data safety accurately against the final SDK/provider behavior; see DATA-SAFETY.md. Provide privacy URL and deletion URL. Complete required testing and production-access questions for this Play Console account; check Console for current eligibility requirements rather than assuming a fixed tester count or duration.
7. Run Play pre-launch report and real-device checks: email links returning to the right account, photos, airplane mode after installation, installation/update preserving data, small screens/font scaling, back button/focus, and battery/background timer limitations. Use staged rollout after tests, with a rollback plan for web changes (the TWA loads the deployed web app).

## URLs for Play Console (after successful website deployment)

- Privacy: https://gatime-beryl.vercel.app/privacy.html
- Account deletion: https://gatime-beryl.vercel.app/delete-account.html
- Website: https://gatime-beryl.vercel.app

## Reference sources to recheck at submission

- https://support.google.com/googleplay/android-developer/answer/13327111 (account deletion)
- https://support.google.com/googleplay/android-developer/answer/10787469 (Data safety)
- https://support.google.com/googleplay/android-developer/answer/14151465 (personal-account testing)
- https://developer.android.com/google/play/requirements/target-sdk
- https://developer.chrome.com/docs/android/trusted-web-activity/
- https://github.com/GoogleChromeLabs/bubblewrap

No publication or Play upload has been performed. Local/mock validation is distinct from production Supabase/Gemini validation and Android device testing.

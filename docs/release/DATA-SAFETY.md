# Data safety worksheet — review before submitting

This is a technical inventory, not a completed Google Play declaration. Verify the Console's current definitions, SDK behavior, processor contracts, billing tier and provider logs. Service-provider transfers may have sharing exceptions under Google's definitions; do not equate “no ads” with “no data collected.”

| Data | Leaves device? | Purpose / handling |
| --- | --- | --- |
| Email, account ID and Google basic profile (name/profile picture URL when provided) | Optional sign-in to Supabase via Google or email | Authentication and account management; Google handles Google consent/login, and Supabase may store provider metadata. Email links use the configured email provider. No Gmail mailbox access is requested. |
| Recipe text, favorites, manual nutrition | When saved to a signed-in account | Cloud storage and multi-device sync via Supabase; guest text stays local unless explicitly imported. Consider user-generated content categories. |
| Chosen recipe photos | With signed-in recipe sync | Stored as resized JPEG data in recipe JSON at Supabase; no broad gallery scan. Consider Photos and videos category. |
| Recipe titles/descriptions/ingredients/steps | Optional translation, initially off | Vercel endpoint forwards these fields to Google Gemini; account token verifies access. Email/photos are not in Gemini payload. Review Gemini data-use/retention terms, especially unpaid tier. |
| Weekly plans, shopping selections, portion choices, language | No intentional cloud transfer | Local browser storage, separated by account/guest; not automatically synced. |
| IP and technical request logs | Hosting/auth/AI/assets requests | Vercel, Supabase, Google and external image providers may process these; review actual logging and retention configuration. Google Fonts and Unsplash are contacted by the web app. |
| Exports | User-directed download/copy | Under user control, not uploaded by the backup tool. |

No ad ID, advertising SDK, analytics SDK, location, contact list, payment or broad gallery permission is implemented in the current source. Confirm this against the merged Android manifest and all final libraries. Nutrition is manually entered recipe content, not a measurement of the user's health; review the Console's health-data definitions based on actual intended use.

Transport uses HTTPS. Storage includes browser-local data and optional Supabase account data. Account deletion removes auth user, recipes and mutation history from the active database, and attempts cleanup of this account on the requesting device. Exported files, guest data and remote device caches remain under user control. Provider backups/logs may follow separate retention. Deleting an individual recipe leaves a tombstone and previous mutation acknowledgements until account deletion; do not claim that individual deletion erases every stored historical copy.

The support mailbox owner must operate the deletion request process and keep privacy/deletion pages accurate when providers or behavior change. Data safety, privacy text and the shipped app must agree. Public release is blocked until real service and device validation completes.

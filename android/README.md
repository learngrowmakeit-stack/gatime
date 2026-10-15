# Gatime Android preparation

This is a Trusted Web Activity (TWA), generated from Google's Bubblewrap 1.27.0 templates. It opens the existing HTTPS recipe app in a compatible browser runtime, sharing that browser's site storage and Supabase account. It is not a separate native database. Test actual browser selection and sign-in routing on devices before claiming migration from a previous browser installation. MyOrganizer uses its own package and listing, under the same Play Console account.

- Proposed application ID: `app.gatime.recipes` (confirm before first Play upload; it cannot be changed for an existing listing).
- Production origin: `https://gatime-beryl.vercel.app` (keep this origin stable; moving domains changes local storage).
- Version: 1.0.0 / code 1. Increment version code for every uploaded update.
- SDK target/compile: 36, minimum: 24 (Android 7). Confirm Play's current required target at upload time.
- No advertising SDK, location, contacts, broad storage or gallery permissions added. Photo selection uses the web file picker.
- Notification delegation disabled. The cooking timer is in-page, not an Android background alarm.

## Source and build

Generated source is checked in at `android/project`. Open this directory in Android Studio. Install Android SDK platform 36 and SDK build tools through SDK Manager, review/accept the SDK licenses, and use a supported JDK (17 or 21). The Gradle wrapper distribution and wrapper JAR are pinned with official Gradle SHA-256 checksums. `android/gradle-wrapper.jar` is the official v8.11.1 wrapper, copied during generation; the upstream Bubblewrap template's legacy wrapper is replaced. Templates retain their Apache 2.0 notices.

From the repository root, run `android/build.sh debug` for a signed test APK (`app.gatime.recipes.test`, label Gatime Test), or `android/build.sh unsigned` for an unsigned release bundle (`app.gatime.recipes`). Build tools are pinned to 36.0.0. The test package and FileProvider authority are separate so it can coexist with the final app. Use Android Studio **Build → Generate Signed App Bundle / APK → Android App Bundle** to produce a signed release AAB. Create the upload keystore in a private location outside the checkout, keep a secure backup, and enroll in Google Play App Signing. Do not commit keys, passwords, local.properties, Play service account files, APKs or AABs. No upload signing key has been created. Debug builds use a separate test package and a local Android debug certificate; this certificate is not suitable for Play releases.

To regenerate into a NEW/empty `android/project` (preserve any manual edits first):

```
npm ci --prefix android/tools
node android/generate.cjs
```

This uses the checked-in configuration and local icons. Generation does not publish, sign, install SDKs or create a Play listing. Generated Maven repositories use `google()` and `mavenCentral()` rather than legacy JCenter.

## Associate the website and Play signing certificate

After creating the Play listing and enrolling in Play App Signing, copy the **SHA-256 app signing certificate** from Play Console's App integrity/App signing page. Use the app signing certificate, not merely the upload certificate. Run from the repository root:

```
node android/link-domain.mjs "AA:BB:...the complete 32-byte SHA-256 fingerprint..."
```

This creates `public/.well-known/assetlinks.json` for the configured package. Deploy the website and verify that `https://gatime-beryl.vercel.app/.well-known/assetlinks.json` returns JSON directly with HTTP 200, without authentication, redirects, or the SPA fallback. Verify the Play-installed app opens without a browser address bar. A placeholder certificate is deliberately not published. Locally signed debug/test installs require their own certificate association; Play internal test installs use the Play signing certificate. Do not add unrelated origins to the trust list.

## Validation status / blockers

The Android SDK (platform 36, build tools 36.0.0 and platform tools), Temurin JDK 21 and Gradle 8.11.1 were installed in the cloud environment using official downloads with published checksums. Debug APK and unsigned release AAB builds now complete successfully. The test APK's v2 signature verifies, and the package targets API 36 with minimum API 24. Its only declared permission is the app-private AndroidX receiver permission; no broad photo/storage, contacts or location permission was found. No native `.so` libraries or keystores are packaged. Neither a physical phone test nor a Play upload has been performed.

The deliberately distributed test APK is in `public/downloads/gatime-test.apk`, with its SHA-256 checksum and installation page `/android-test.html`. It is signed with a local debug certificate, not an upload key. `public/.well-known/assetlinks.json` currently associates the separate **test package** and its actual debug certificate with the website. Verify this URL after Vercel deployment. Replace that association with the real Play package/certificate at public release.

The unsigned AAB is retained at `android/project/app/build/outputs/bundle/release/app-release.aab` (ignored by Git). It is not ready for Play upload. Release signing requires an owner-controlled private upload key and backup. The generated `:app:signReleaseBundle` task name does not mean an unsigned configuration produced a signed artifact; `jarsigner` confirms this AAB is unsigned.


## Private release signing

`android/build.sh release` refuses to run unless all four settings exist: `GATIME_UPLOAD_STORE_FILE` (absolute keystore path outside the checkout), `GATIME_UPLOAD_STORE_PASSWORD`, `GATIME_UPLOAD_KEY_ALIAS`, `GATIME_UPLOAD_KEY_PASSWORD`. `android/signing.gradle` validates the private path and configures release signing only when the settings are complete. It never creates an upload key. Enter values using your local/private build environment, not command-line arguments or chat. Back up the upload key securely before publishing. Debug signing material stays in the Android user directory outside Git.

After Play App Signing is enabled, use the **Play app signing** certificate for the production domain association. The temporary `--test` option of `android/link-domain.mjs` targets the separate test package and replaces the association file; it must not be mistaken for the release certificate. When the final Play certificate is available, generate the normal association again without `--test`.

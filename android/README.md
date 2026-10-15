# Gatime Android preparation

This is a Trusted Web Activity (TWA), generated from Google's Bubblewrap 1.27.0 templates. It opens the existing HTTPS recipe app in a compatible browser runtime, sharing that browser's site storage and Supabase account. It is not a separate native database. Test actual browser selection and sign-in routing on devices before claiming migration from a previous browser installation. MyOrganizer uses its own package and listing, under the same Play Console account.

- Proposed application ID: `app.gatime.recipes` (confirm before first Play upload; it cannot be changed for an existing listing).
- Production origin: `https://gatime-beryl.vercel.app` (keep this origin stable; moving domains changes local storage).
- Version: 1.0.0 / code 1. Increment version code for every uploaded update.
- SDK target/compile: 36, minimum: 23. Confirm Play's current required target at upload time.
- No advertising SDK, location, contacts, broad storage or gallery permissions added. Photo selection uses the web file picker.
- Notification delegation disabled. The cooking timer is in-page, not an Android background alarm.

## Source and build

Generated source is checked in at `android/project`. Open this directory in Android Studio. Install Android SDK platform 36 and SDK build tools through SDK Manager, review/accept the SDK licenses, and use a supported JDK (17 or 21). The Gradle wrapper distribution and wrapper JAR are pinned with official Gradle SHA-256 checksums. `android/gradle-wrapper.jar` is the official v8.11.1 wrapper, copied during generation; the upstream Bubblewrap template's legacy wrapper is replaced. Templates retain their Apache 2.0 notices.

From `android/project`, run `./gradlew assembleDebug` for testing or `./gradlew bundleRelease` for an unsigned release bundle. Use Android Studio **Build → Generate Signed App Bundle / APK → Android App Bundle** to produce a signed release AAB. Create the upload keystore in a private location outside the checkout, keep a secure backup, and enroll in Google Play App Signing. Do not commit keys, passwords, local.properties, Play service account files, APKs or AABs. No signing key or signed AAB has been created by this preparation.

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

The Android source and artwork were generated. The wrapper JAR was checked against Gradle's official v8.11.1 checksum. An Android build was not completed: this environment has Java 21 but no configured Android SDK, and the wrapper's direct Java download could not resolve services.gradle.org. Do not treat the source as an installable or Play-ready artifact. Build and run on Android, verify merged manifest/permissions, authenticated email deep links, gallery picker, backups, offline startup, accessibility, app updates and Play pre-launch report before release.

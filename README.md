# Gatime

An installable personal recipe book with ingredients, step-by-step instructions, categories, favorites, nutrition per serving, and optional private accounts with automatic device syncing.

## Develop

Requires Node.js 20.19+ or 22.12+ (Node 24 is validated).

```sh
npm ci
npm run dev
```

Open the address shown by Vite in your browser. Without sign-in, recipes save in this browser's local storage. With Supabase configured and a signed-in account, recipes sync automatically; offline edits queue on the device until reconnection. Use Export and Import for backups. Clearing browser data removes local recipes and unsynced changes. See [cloud account setup](supabase/README.md) to enable sign-in.

Nutrition is entered manually per serving. The six starter recipes include approximate sample values; the app does not calculate nutrition from ingredients. Check ingredient labels or a nutrition calculator when entering your own values.

## Check and build

```sh
npm test
npm run build
npm run preview
```

The production site is built into `dist/`. Deploy this directory to a static hosting service. Recipe photos and optional fonts load from external services; recipe storage and editing work without these images.

## Install on Android and use offline

Visit the deployed HTTPS site in Chrome. Use **Install Gatime** in the sidebar, or Chrome's **⋮ → Add to Home screen → Install**. The app opens in its own window with a Gatime icon. No Play Store account is needed. Install support depends on the browser.

After the first online visit finishes caching, the app and built-in recipe artwork work offline. Remote photos and fonts still need Internet access. Recipes remain local to the browser/device; export a backup before clearing site data or moving devices. Installing does not enable sync by itself; configure Supabase and sign in on each device to use cloud sync.

Offline support is enabled in the production build (`npm run build` then `npm run preview`), not the development server. Updates display an **Update app** button; save unfinished edits before updating. Vercel deploys the app from `main` using the Vite preset and `dist` output folder.

## Sync validation

`npm test` exercises recipe validation, offline outboxes, lost acknowledgements, concurrent edits, deletion conflicts, account isolation, and the actual SQL schema in an isolated PostgreSQL engine (PGlite). Browser sync checks use a mock email/database service; real email and cross-device sync require a configured Supabase project.

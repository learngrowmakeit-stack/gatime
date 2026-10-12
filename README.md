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

## Shopping lists

Select the **Add to shopping list** checkbox on recipe cards, then open **Shopping list** from the sidebar or top bar. Ingredients are combined for the recipes' full quantities. Matching ingredient names and compatible metric units are summed; differing descriptions and incompatible units stay separate. Unknown amounts keep their original wording and show a repetition count. Mark items as bought, copy the list, or download a text file. Changes to an ingredient's total or contributing recipes reset its purchased status.

Selections and purchased items persist offline in browser storage, separately for each account and the device-only collection. Shopping lists do not currently sync across devices. Removing a recipe from the list or clearing it does not delete any recipes.

## Recipe photos

Use **Choose from gallery** when adding or editing a recipe. A preview appears before saving; **Change photo** and **Remove photo** are available. JPG, PNG, WebP, GIF and AVIF inputs up to 20 MB are decoded by the browser, resized to at most 768 pixels, and compressed as JPEG to fit the existing recipe storage limit. HEIC inputs require exporting as JPG first. Uploaded photos are embedded in recipes, so they work offline, are included in backups, and sync with signed-in accounts without a new Supabase storage bucket or schema change. Update Gatime on all devices to display embedded photos. Browser storage limits still apply; an unsuccessful save leaves the previous recipe unchanged.

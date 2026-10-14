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

Select the **Add to shopping list** checkbox on recipe cards, then open **Shopping list** from the sidebar or top bar. Ingredients are combined for the chosen portion counts. Matching ingredient names and compatible metric units are summed; differing descriptions and incompatible units stay separate. Unknown amounts keep their original wording and show a repetition count. Mark items as bought, copy the list, or download a text file. Changes to an ingredient's total or contributing recipes reset its purchased status.

Open a recipe or the shopping list and use **Cooking portions** to choose 1–1000 portions. Clear leading ingredient quantities scale from the original recipe each time; package sizes and preparation notes remain unchanged. Review ingredients without clear amounts and quantities written inside instructions. Cooking times and nutrition per serving stay unchanged, and editing still opens the original recipe. Portion choices are saved locally and work offline.

Selections and purchased items persist offline in browser storage, separately for each account and the device-only collection. Shopping lists do not currently sync across devices. Removing a recipe from the list or clearing it does not delete any recipes.

## Recipe photos

Use **Choose from gallery** when adding or editing a recipe. A preview appears before saving; **Change photo** and **Remove photo** are available. JPG, PNG, WebP, GIF and AVIF inputs up to 20 MB are decoded by the browser, resized to at most 768 pixels, and compressed as JPEG to fit the existing recipe storage limit. HEIC inputs require exporting as JPG first. Uploaded photos are embedded in recipes, so they work offline, are included in backups, and sync with signed-in accounts without a new Supabase storage bucket or schema change. Update Gatime on all devices to display embedded photos. Browser storage limits still apply; an unsuccessful save leaves the previous recipe unchanged.

## Interface languages

Choose **Shqip**, **Deutsch**, or **English** in the top bar. Albanian is the default. The choice is saved on this device, works offline, and updates the page language and title. Menus, categories, recipe forms, photo controls, account messages, shopping lists and shopping export headings are translated. Original recipe text remains as written; signed-in users can optionally view translated recipe content using the service described below. Category IDs remain unchanged in storage and cloud sync. Add or edit interface translations in `src/translations.js`; interpolation parameters must be preserved.

## Paste a complete recipe

In Add recipe, paste copied text into **Paste a complete recipe**. A blank form fills automatically. When editing existing text, use **Fill recipe fields** explicitly so pasting does not overwrite it silently. Headings in Albanian, German and English are supported, as are common time, servings and category labels. Ingredients and numbered instructions are separated; unmatched notes remain visible for review. Nutrition is imported only when explicitly labelled per serving. Always review the result and then save. Parsing works offline and sends nothing to an external service.

## Translate recipe content

The recipe view can translate titles, descriptions, ingredients and steps to the chosen interface language. Signed-in users use the Vercel `/api/translate` function. Add **GEMINI_API_KEY** as a **Secret** in Vercel's Production environment, then deploy the current commit. Do not prefix it with `VITE_`, put it in GitHub, or share it in chat. The function also uses the existing public Supabase variables to verify sign-in. **GEMINI_MODEL** optionally overrides the default `gemini-flash-latest` alias recommended by Google's SDK documentation.

Only recipe ID and text fields are sent to Google's Gemini API; photos and account email are excluded. Original recipes stay unchanged. Editing works on originals; translation can be toggled off. Server checks ensure ingredient/step counts and numeric amounts match before returning a result. Review translated cooking directions; numerical checks cannot verify every semantic detail. Free usage quotas and any charges are controlled by your Google project. The endpoint validates authenticated sessions and request size and uses a best-effort per-instance rate limit; provider quotas still apply.

Translations are cached separately for each account and language on this browser (up to 60 cached entries); cached results work offline. Source-text changes invalidate the cache. Translation failure, missing configuration or rate limits leave the original available. Vite's standalone dev/preview server does not run Vercel functions; use the deployed app or Vercel's local development tools for live translation. Automated API and browser checks use mocked provider responses; actual Gemini availability and credentials require validation on the configured deployment.

## Weekly meal planning

Open **Weekly meal plan** in the navigation. Choose recipes for breakfast, lunch and dinner from Monday to Sunday, with portions per meal. Browse previous or next weeks; choices persist offline, separately per account and guest. Plans are local to this device and do not sync. Clearing a week requires confirmation and never deletes recipes. Deleted recipes are flagged so you can replace them. Creating the shopping list replaces its current selection and purchased flags; repeated recipes contribute their total portions. Original recipes remain unchanged.

## Cooking mode

Open a recipe, choose portions, and click **Start cooking**. Follow one instruction at a time, mark steps completed, navigate backward or forward, or jump to a numbered step. Expand Ingredients for a separate checklist with scaled quantities. Instructions keep their original numerical amounts. Progress lasts only while this cooking view is open; exiting resets it. Works offline with available recipe content.

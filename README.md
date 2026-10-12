# Gatime

A personal recipe book with ingredients, step-by-step instructions, categories, favorites, and nutrition per serving.

## Develop

Requires Node.js 20.19+ or 22.12+ (Node 24 is validated).

```sh
npm ci
npm run dev
```

Open the address shown by Vite in your browser. Recipes are saved in this browser's local storage, not an online account. Use Export and Import to back up or move recipes. Clearing browser data removes the local collection.

Nutrition is entered manually per serving. The six starter recipes include approximate sample values; the app does not calculate nutrition from ingredients. Check ingredient labels or a nutrition calculator when entering your own values.

## Check and build

```sh
npm test
npm run build
npm run preview
```

The production site is built into `dist/`. Deploy this directory to a static hosting service. Recipe photos and optional fonts load from external services; recipe storage and editing work without these images.

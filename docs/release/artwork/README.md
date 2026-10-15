# Store artwork sources

The feature graphic is rendered from `feature.html` with the existing app icon; no new stock photograph is introduced. `scripts/capture-store.cjs` captures the real web UI with sample recipes and blocked external photos/fonts, allowing the app's own local illustration fallback to load. It also renders the feature layout. These are browser reference images, not physical Android screenshots.

Start a production preview on port 4173, then run the script with Playwright available:

```
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/capture-store.cjs
```

The default Chromium executable is `/usr/bin/chromium`; override with `CHROMIUM_PATH`. Images are written to `public/play-store/` at their declared dimensions. The icon is copied from `public/icons/icon-512.png`. Metadata, gallery and ZIP must be refreshed if images or descriptions change. The reference captures use only sample data and do not connect to a real account. Replace references with final device captures for Play submission. Verify asset rights and current Play format rules at submission time.

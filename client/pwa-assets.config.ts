import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Rasterizes public/livre-mark.svg into the PWA icon set (Android 192/512 + maskable, the
// iOS 180 apple-touch-icon, and the legacy favicon.ico). The minimal-2023 preset composites the
// source at padding 0 over each canvas, so the full-bleed gold tile carries through with no
// transparency — exactly what the apple-touch-icon needs (transparency renders black on iOS) and
// what keeps Android's maskable mask showing gold to the edges. favicon.svg is authored by hand as
// an adaptive icon and referenced directly in index.html, so it is deliberately not generated here.
// Run `npm run generate-pwa-assets -w client` after changing the mark.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/livre-mark.svg'],
});

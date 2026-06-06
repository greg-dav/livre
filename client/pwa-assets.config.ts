import { defineConfig } from '@vite-pwa/assets-generator/config';

// Rasterizes public/livre-mark.svg (a bare gold "L" on transparent) into the PWA icon set: Android
// 192/512 + maskable, the iOS 180 apple-touch-icon, and the legacy favicon.ico. We spell out the
// preset instead of reusing minimal2023Preset because its apple/maskable defaults composite onto a
// WHITE canvas at 0.3 padding — that produced the white home-screen tile we want gone.
//
//   - transparent (favicon + Android non-maskable): keep the alpha, small padding so the L breathes.
//   - apple (iOS home screen): transparent background. iOS has no per-mode home-screen icon and
//     fills transparency with black, so the L lands on a dark tile that matches the dark dock.
//   - maskable (Android adaptive mask): must be full-bleed, so it carries its own dark tile
//     (#13120F, the roman-dark surface) with the standard 0.3 mask-safe padding.
//
// favicon.svg is hand-authored as an adaptive icon and referenced directly in index.html, so it is
// deliberately not generated here. Run `npm run generate-pwa-assets -w client` after changing the mark.
export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0.05,
    },
    apple: {
      sizes: [180],
      padding: 0.12,
      resizeOptions: { background: 'transparent' },
    },
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: { background: '#13120F' },
    },
  },
  images: ['public/livre-mark.svg'],
});

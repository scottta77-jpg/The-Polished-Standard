# HousEase (Exact Standalone Replica)

Exact 1:1 standalone replica of `https://housease.webflow.io` across all **28 pages**, using the exact site stack (HTML5, Webflow CSS, jQuery 3.5.1, Webflow IX3 runtime, and GSAP 3.15 with `ScrollTrigger`, `SplitText`, and `Observer`) and 100% locally self-hosted assets, fonts, images, and background videos.

## Quick Start

```bash
npm run dev
```

Then open **http://localhost:3000**.

## Included Pages (28 Routes)

- **Main Pages**: `/`, `/about`, `/services`, `/project`, `/blog`, `/contact`
- **Service Detail Pages (5)**:
  - `/services/move-out-cleaning`
  - `/services/window-cleaning`
  - `/services/carpet-upholstery-cleaning`
  - `/services/bathroom-cleaning`
  - `/services/kitchen-cleaning`
- **Project Detail Pages (6)**:
  - `/projects/bright-living-space-transformation`
  - `/projects/complete-apartment-cleaning-project`
  - `/projects/deep-carpet-and-floor-care`
  - `/projects/fresh-move-in-cleaning-service`
  - `/projects/kitchen-surface-refresh`
  - `/projects/recurring-home-cleaning-programme`
- **Blog Detail Pages (6)**:
  - `/blog/common-cleaning-mistakes-to-avoid`
  - `/blog/easy-ideas-for-a-comfortable-home-1mtbi`
  - `/blog/essential-tips-for-a-cleaner-bathroom`
  - `/blog/how-to-plan-a-seasonal-deep-clean`
  - `/blog/simple-ways-to-keep-home-fresh-r896e`
  - `/blog/smart-cleaning-habits-for-every-home-5yual`
- **Template Utility Pages (5)**: `/style-guide`, `/licenses`, `/changelog`, `/404`, `/401`

## Project Structure

- `assets/css/` — `housease.webflow.css` + local variable `@font-face` definitions (`fonts.css`)
- `assets/fonts/` — Self-hosted `Montserrat` and `Inter Tight` `.woff2` font files
- `assets/js/gsap/` — `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `Observer.min.js` (v3.15.0)
- `assets/js/webflow/` — Shared and per-page Webflow IX3 / slider / navbar / background-video runtime chunks
- `assets/js/standalone-forms.js` — Standalone client-side form submission handler
- `assets/images/` & `assets/videos/` — All `.avif`, `.webp`, `.png`, `.jpeg`, `.svg`, `.mp4`, `.webm`, and poster `.jpg` assets
- `server.js` — Zero-dependency Node HTTP server with clean URL routing, custom 404 handling, and `206 Partial Content` byte-range streaming for video looping


# Fonts

## Fonts 2 library (`/public/fonts2`)

The full **Fonts 2** collection is symlinked at `public/fonts2` → `../Text Effect/Fonts 2`.

| File | Purpose |
|---|---|
| `wix-fonts.css` | Wix editor family aliases (`marzo-w00-regular`, `vag-rounded-next`, `feonie`, etc.) |
| `fonts2-catalog.css` | **1,184** `@font-face` rules for every font in Fonts 2 |
| `fonts.css` | Legacy placeholder |

Regenerate after adding fonts:

```bash
npm run fonts:build
```

## Font picker groups

- **Wix Editor** — exact Wix text-effect families (16 aliases)
- **Fonts 2** — full local catalog from your Fonts 2 folder

## Wix preset → font file

| Wix family | Source file |
|---|---|
| `marzo-w00-regular` | Editor Fonts/not chosen/Marzo.otf |
| `brandon-grot-w01-light` | Editor Fonts/Chosen/Brandon_light.otf |
| `enfonix` | FONTS UPLOAD FOR WWW/All/Enfonix.otf |
| `feonie` | FONTS UPLOAD FOR WWW/All/feonie.otf |
| `ogg` | FONTS UPLOAD FOR WWW/All/Ogg 1.otf |
| `gaude` | FONTS UPLOAD FOR WWW/All/Gaude.otf |
| `vag-rounded-next` | FONTS UPLOAD FOR WWW/All/VAG Rounded Next.otf |
| `oktah-round` | FONTS UPLOAD FOR WWW/All/Oktah Round 1.otf |
| `benzin` | FONTS UPLOAD FOR WWW/All/Benzin 1.ttf |
| `dancingscript-regular` | FONTS UPLOAD FOR WWW/All/DancingScript-Regular.ttf |
| `climate-crisis` | Final Wixel fonts/ClimateCrisis-Regular.ttf |
| `fahkwang` | Final Wixel fonts/Fahkwang-Regular.ttf |
| `syne-extrabold` | Final Wixel fonts/Syne-ExtraBold.ttf |
| `modak` | Final Wixel fonts/Modak-Regular.ttf |
| `press-start-2p` | Final Wixel fonts/PressStart2P-Regular.ttf |
| `orbitron` | Final Wixel fonts/Orbitron-Regular.ttf |

**Not in Fonts 2:** `avatar` (Fluffy preset) — still uses system fallback.

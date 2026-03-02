# Design System Guide — Text Combination App

Use this as a reference to replicate the visual language of this app in any design context (Google Slides, Figma, web, print).

---

## 1. Color Palette

### Primary Palette

| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Accent** | `#3b82f6` | 59, 130, 246 | Buttons, active states, links, highlights, key data |
| **Accent Soft** | `rgba(59,130,246,0.08)` | — | Hover fills, subtle backgrounds, badges |
| **Accent Glow** | `rgba(59,130,246,0.14)` | — | Focus rings, emphasis halos |

### Text Hierarchy

| Role | Hex | Usage |
|------|-----|-------|
| **Text 1 (Primary)** | `#0f172a` | Headlines, primary content, key labels |
| **Text 2 (Secondary)** | `#334155` | Body text, descriptions |
| **Text 3 (Muted)** | `#94a3b8` | Captions, secondary labels, placeholder text |
| **Text 4 (Subtle)** | `#64748b` | Section headers, metadata |

### Surface & Background

| Role | Value | Usage |
|------|-------|-------|
| **Page Background** | Gradient: `#eef2f7` → `#e8edf5` → `#f0f3f8` at 145° | Full-page background |
| **Glass Surface** | `rgba(255,255,255,0.52)` | Cards, panels |
| **Glass Strong** | `rgba(255,255,255,0.70)` | Top bars, headers |
| **Glass Border** | `rgba(255,255,255,0.48)` | Panel borders |
| **Border** | `rgba(0,0,0,0.05)` | Dividers, separators |
| **Control Border** | `rgba(0,0,0,0.07)` | Inputs, dropdown borders |
| **Control Hover** | `rgba(255,255,255,0.85)` | Hovered input background |

### Canvas Swatches (for background variety)

| Light | Warm/Cool | Dark |
|-------|-----------|------|
| `#ffffff` | `#fef3c7` (warm cream) | `#18181b` |
| `#fafaf9` | `#ecfdf5` (cool mint) | `#09090b` |
| `#f1f5f9` | | `#1e1b4b` (deep indigo) |

### Semantic Colors

| Role | Hex |
|------|-----|
| **Success** | `#16a34a` |
| **Error / Danger** | `#dc2626` / `#ef4444` |
| **Warning** | `#f59e0b` |
| **Purple accent** | `#7c3aed` |
| **Teal accent** | `#059669` |

---

## 2. Typography

### Font Stack

```
-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif
```

For Google Slides: Use **Inter** or **DM Sans** as the closest web-safe equivalent.

### Type Scale

| Role | Size | Weight | Letter Spacing | Transform | Example |
|------|------|--------|----------------|-----------|---------|
| **App Title** | 11px | 700 | 0.12em | UPPERCASE | `TEXT COMBINATION` |
| **Section Header** | 10px | 600 | 0.08em | UPPERCASE | `01 TEXT STYLE` |
| **Category Label** | 9px | 600 | 0.10em | UPPERCASE | `FONT FAMILY`, `COLOR` |
| **Body / Control** | 11–12px | 400–500 | 0.01em | none | Control values, descriptions |
| **Small Label** | 9px | 700 | 0.06em | UPPERCASE | Numbered indices, tags |
| **Tiny Meta** | 8px | 600 | 0.07em | UPPERCASE | Badges, step counters |
| **Monospace** | 10px | 400 | — | — | Code blocks, technical values |

### Slide Deck Translation (scale ×3 for presentation)

| Slide Role | Size (pt) | Weight | Spacing |
|------------|-----------|--------|---------|
| **Slide title** | 36pt | 700 | Wide (0.1em+) |
| **Section header** | 28–30pt | 600 | Wide |
| **Category / Label** | 18pt | 600 | Wide, uppercase |
| **Body text** | 16–18pt | 400 | Normal |
| **Caption / Meta** | 12–14pt | 500 | Slightly wide |
| **Tiny annotation** | 10pt | 600 | Wide, uppercase |

### Key Typography Rules

- **Labels are ALWAYS uppercase** with wide letter-spacing (0.06–0.12em)
- **Weights are restrained**: 300 for decorative, 400 for body, 500–600 for UI labels, 700 for titles
- **Never use bold (800/900)** — the heaviest weight is 700
- **Numbers use tabular figures** (`font-variant-numeric: tabular-nums`)
- **Minimal font sizes** — small text is intentional and elegant, never decorative

---

## 3. Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 2–3px | Tight internal gaps |
| **sm** | 4–6px | Small gaps, pill padding |
| **md** | 7–8px | Row gaps, standard spacing |
| **lg** | 10–12px | Section padding, card gaps |
| **xl** | 14–16px | Panel padding, content padding |
| **2xl** | 18px | Topbar padding, generous spacing |
| **3xl** | 48px | Canvas padding, breathing room |

### Slide Deck Translation

| Slide Element | Margin/Padding |
|---------------|----------------|
| **Content from edge** | 48–64px |
| **Between sections** | 32–48px |
| **Between items** | 16–24px |
| **Between label and value** | 8–12px |
| **Internal card padding** | 24–32px |

---

## 4. Visual Effects

### Glassmorphism (the signature look)

This app's entire aesthetic is built on frosted glass panels:

```
Background: rgba(255, 255, 255, 0.52)
Backdrop filter: blur(24px) saturate(180%)
Border: 1px solid rgba(255, 255, 255, 0.48)
Shadow: 0 4px 24px rgba(0,0,0,0.045), 0 1px 3px rgba(0,0,0,0.02)
Inner highlight: inset 0 1px 0 rgba(255,255,255,0.55)
```

**For Google Slides:**
- Use white shapes at 50–65% opacity over a blue-gray gradient background
- Add a very subtle drop shadow (blur 12, opacity 6–8%)
- Use thin white borders (0.5pt, 50% opacity white)

### Shadow Hierarchy

| Level | Shadow | When to use |
|-------|--------|-------------|
| **Resting** | `0 4px 24px rgba(0,0,0,0.045)` | Cards, panels at rest |
| **Hover** | `0 8px 32px rgba(0,0,0,0.07)` | Cards on hover / emphasis |
| **Elevated** | `0 12px 48px rgba(0,0,0,0.12)` | Tooltips, floating panels |
| **Modal** | `0 24px 64px rgba(0,0,0,0.12)` | Overlays, hero cards |
| **Subtle** | `0 1px 3px rgba(0,0,0,0.02)` | Top bars, minimal depth |

**Key insight:** Shadows are extremely subtle. Max opacity is 12–14%. This creates depth without heaviness.

### Border Radius

| Value | Usage |
|-------|-------|
| **4–6px** | Small controls, pills, badges |
| **7–8px** | Buttons, inputs, dropdowns |
| **10px** | Cards, content blocks |
| **12px** | Prominent buttons, tags |
| **14–16px** | Panels, modals |
| **50%** | Circular elements (avatars, dots) |
| **999px** | Full-pill shapes |

**For Slides:** Use 8–12pt corner radius on rectangles. Generous rounding = modern.

---

## 5. Animation & Motion Principles

### Easing Curves

| Name | Curve | Feel |
|------|-------|------|
| **Out** | `cubic-bezier(0.22, 1, 0.36, 1)` | Smooth deceleration — the default |
| **Spring** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot — playful |
| **Smooth** | `cubic-bezier(0.4, 0, 0.2, 1)` | Balanced — Material-style |

### Duration Patterns

| Context | Duration |
|---------|----------|
| **Color / opacity** | 200–350ms |
| **Transform (move/scale)** | 300–500ms |
| **Layout (accordion)** | 450ms |
| **Entrance stagger** | 180ms between items |

**For Slides:** Use "Appear" transitions at 0.3–0.5 second duration with staggered delays (0.15s between items). Never use bouncy or gimmicky transitions.

---

## 6. Component Patterns

### Cards / Panels

```
- White glass background (50–70% opacity)
- 1px border, rgba white (48% opacity)
- Rounded corners: 14px
- Padding: 14–16px
- Shadow: subtle multi-layer
- Inner highlight: inset top 1px white at 55%
```

### Buttons

**Primary (accent):**
```
- Background: #3b82f6
- Color: white
- Border-radius: 8px
- Height: 28px
- Font: 11px / 500
- Shadow: 0 2px 10px rgba(59,130,246,0.3)
- Hover: translateY(-1px), stronger shadow
```

**Secondary (ghost):**
```
- Background: rgba(255,255,255,0.50)
- Border: 1px solid rgba(0,0,0,0.07)
- Border-radius: 8px
- Color: #334155
- Hover: white background, subtle shadow
```

### Inputs / Controls

```
- Height: 28px
- Background: rgba(255,255,255,0.60)
- Border: 1px solid rgba(0,0,0,0.07)
- Border-radius: 7px
- Font: 11px
- Padding: 0 8px
```

### Pills / Tags

```
- Active: accent background, white text, shadow glow
- Inactive: white glass, subtle border
- Border-radius: 12px
- Height: 24px
- Font: 10px / 500
```

---

## 7. Layout Principles

### Hierarchy

1. **Top bar** — Full-width, stronger glass, minimal height (48px)
2. **Side panel** — Fixed width (280px), glass surface, scrollable
3. **Canvas** — Flexible, center-aligned content, generous padding
4. **Floating panels** — Draggable, elevated shadows, compact
5. **Modals** — Centered overlay, backdrop blur, largest shadows

### Grid & Alignment

- Side panel + canvas is the primary split
- Internal grids use 2-column for related pairs (e.g., Weight + Case)
- All text is left-aligned in panels, center-aligned on canvas
- Consistent horizontal padding: 14px in panels, 18px in top bar

### Whitespace Rules

- **Generous breathing room** — 48px canvas padding
- **Tight UI density** — 7–8px gaps between controls
- **Clear section separation** — 1px borders, not extra whitespace
- **Labels close to content** — 4–6px gap between label and value

---

## 8. Google Slides Application Guide

### Slide Background

Use a **soft blue-gray gradient** at 145°:
- Top-left: `#eef2f7`
- Center: `#e8edf5`
- Bottom-right: `#f0f3f8`

Or a flat `#f1f5f9` if gradients aren't supported.

### Card Style

1. Draw a rounded rectangle (corner radius 12pt)
2. Fill: white at 55–65% opacity
3. Border: 0.5pt, white at 50%
4. Shadow: blur 12, offset-y 4, color black at 6%

### Text on Slides

| Element | Font | Size | Weight | Color | Spacing |
|---------|------|------|--------|-------|---------|
| **Slide title** | Inter / DM Sans | 36pt | Bold | `#0f172a` | +100 (wide) |
| **Subtitle** | Inter | 14pt | Medium | `#64748b` | +50, UPPERCASE |
| **Section label** | Inter | 10pt | SemiBold | `#94a3b8` | +150, UPPERCASE |
| **Body** | Inter | 16pt | Regular | `#334155` | Normal |
| **Accent number** | Inter | 48pt | Bold | `#3b82f6` | Normal |
| **Caption** | Inter | 11pt | Medium | `#94a3b8` | Normal |

### Color Usage on Slides

- **Headlines:** `#0f172a` (near-black, not pure black)
- **Body text:** `#334155` (softer dark)
- **Labels and metadata:** `#94a3b8` (muted blue-gray)
- **Accent highlights:** `#3b82f6` (blue) — sparingly
- **Backgrounds:** Never pure white. Use `#f1f5f9` or the gradient
- **Borders:** Never dark. Use `rgba(0,0,0,0.05)` equivalent (very light gray)

### Key Do's and Don'ts

**DO:**
- Use the blue-gray palette consistently — it's sophisticated and calm
- Keep shadows extremely subtle (max 8–12% opacity)
- Use wide letter-spacing on uppercase labels
- Leave generous whitespace — less is more
- Use frosted/translucent surfaces over gradients
- Keep border radius consistent (12pt for cards)
- Use the accent blue sparingly — only for key actions/data
- Stagger entrance animations by 0.15s per item

**DON'T:**
- Use pure black (`#000000`) — always use `#0f172a` or `#334155`
- Use pure white backgrounds — always tint slightly blue-gray
- Use thick borders — max 1px, very low opacity
- Use heavy drop shadows — this aesthetic is about subtle depth
- Use more than one accent color per slide
- Use decorative fonts in the UI — system fonts only
- Use bold (800/900) weights — cap at 700
- Overcrowd slides — the app's beauty comes from breathing room

---

## 9. Mood & Aesthetic Summary

**One-line:** Clean, frosted, editorial — like a high-end design tool that happens to look like a magazine.

**Keywords:** Glassmorphism, blue-gray palette, subtle depth, wide-tracked uppercase labels, generous whitespace, restrained accent color, micro-interactions, editorial typography.

**References:** Linear app, Raycast, Arc browser, Apple's visionOS panels, Vercel dashboard.

**The feeling:** Professional without being corporate. Modern without being trendy. Minimal without being empty.

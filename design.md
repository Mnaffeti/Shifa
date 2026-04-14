# Medica Dashboard — Design Specification
> Reference document for dev agents to replicate or extend the Medica healthcare dashboard UI.

---

## 1. Brand Identity

| Property | Value |
|---|---|
| Product Name | **Medica** |
| Logo | Two overlapping diamond/kite shapes — teal `#1A9E9E` + yellow-green `#C8E04A` |
| Tagline / Context | Hospital Management Dashboard |

---

## 2. Color Palette

### Primary Colors
| Role | Name | Hex |
|---|---|---|
| Brand Teal (primary) | Deep Teal | `#1A4747` / `#0D3D3D` |
| Brand Accent (CTA) | Yellow-Green / Chartreuse | `#C8E04A` |
| Appointment Highlight | Cyan / Aqua | `#3DD6D0` |
| Schedule Card Active | Amber / Gold | `#F5C518` or `#FFCF44` |

### Neutral / Surface Colors
| Role | Hex |
|---|---|
| Page Background | `#F0F4F8` (soft blue-grey gradient) |
| Card Background | `#FFFFFF` |
| Card Border / Divider | `#E8EDF2` |
| Sidebar / Dark Card BG | `#1A3A3A` (dark teal) |

### Text Colors
| Role | Hex |
|---|---|
| Primary Text | `#111827` |
| Secondary / Label Text | `#6B7280` |
| Muted / Caption | `#9CA3AF` |
| Inverse (on dark) | `#FFFFFF` |

### Status / Badge Colors
| Status | Hex |
|---|---|
| Pending | `#F59E0B` (amber text, light amber bg `#FEF3C7`) |
| Completed | `#06B6D4` (cyan text, light cyan bg `#CFFAFE`) |
| Active Nav Pill | `#C8E04A` bg + `#1A4747` text |

---

## 3. Typography

### Font Families
| Role | Font | Fallback |
|---|---|---|
| Headings / Display | `"Plus Jakarta Sans"` or `"Nunito"` | `sans-serif` |
| Body / UI | `"Inter"` or `"DM Sans"` | `sans-serif` |

> Both fonts should be loaded from Google Fonts.

### Type Scale
| Element | Size | Weight | Color |
|---|---|---|---|
| Page Greeting (`Good Morning!`) | `36–40px` | `800` | `#111827` |
| Section Heading | `20–22px` | `700` | `#111827` |
| Card Metric (e.g. `$100,675`) | `22–26px` | `700` | `#111827` |
| Card Label (e.g. `Total Revenue`) | `13–14px` | `500` | `#6B7280` |
| Update Badge Text | `11–12px` | `400` | `#9CA3AF` |
| Table Header | `11px` | `600` (uppercase) | `#9CA3AF` |
| Table Body | `13–14px` | `400` | `#374151` |
| Nav Items | `14px` | `500` | `#374151` |
| Sub-caption / time | `12px` | `400` | `#6B7280` |

---

## 4. Spacing & Layout

### Grid
- **Container max-width:** `1280px`, centered
- **Outer padding:** `32px` horizontal, `24px` vertical
- **Main layout:** 3-column CSS Grid
  - Column 1 (left sidebar stats): `~280px` fixed
  - Column 2 (center content): `flex: 1` (charts + table)
  - Column 3 (right panel): `~300px` fixed
- **Row gap:** `20px`
- **Column gap:** `24px`

### Card Specs
| Property | Value |
|---|---|
| Border Radius | `16px` |
| Padding | `20–24px` |
| Background | `#FFFFFF` |
| Box Shadow | `0 2px 12px rgba(0,0,0,0.06)` |
| Border | `1px solid #E8EDF2` (optional, subtle) |

### Stat Card (Left Column)
```
┌─────────────────────────────────────────┐
│  [Icon Circle]  Label         [Update]  │
│                 Value                   │
└─────────────────────────────────────────┘
```
- Icon circle: `48px`, background `#F5F9C4` (soft yellow-green), border-radius `50%`
- Icon color: `#C8E04A` or `#1A9E9E`
- Update badge: rounded pill, bg `#F3F4F6`, text `#9CA3AF`, `font-size: 11px`

---

## 5. Components

### 5.1 Top Navigation Bar
- **Height:** `64px`
- **Background:** `#FFFFFF` with soft shadow
- **Logo:** left-aligned, `24px` font, bold
- **Nav items:** horizontal pill group, center-aligned
  - Default: transparent bg, `#374151` text
  - Active: `#C8E04A` bg pill, `#1A4747` text, `🏠` icon prefix
- **Right icons:** Search `🔍`, Bell `🔔`, Avatar circle `40px`
- **Border-radius of active pill:** `999px`

### 5.2 Date Range + Export Bar
- Inline row below greeting
- Date pill: `12px` text, `#6B7280`, icon `🏠`, bg `#F3F4F6`, `border-radius: 8px`
- Export button: `#1A4747` bg, `#FFFFFF` text, `border-radius: 10px`, arrow-out icon suffix

### 5.3 Stat Cards (×4)
- Stacked vertically in column 1
- Each card: flex row, icon left, label + value center, update badge right
- Bottom of first card: mini bar chart (sparkline), dark teal bars `#1A4747`, varying heights

### 5.4 Revenue Statistics Chart (Center Top)
- **Type:** Bar chart (vertical, rounded bars)
- **Active bar color:** `#3DD6D0` (teal)
- **Inactive bar color:** `#B2EAE8` (light teal)
- **Tooltip:** Rounded pill above bar — `#F5C518` bg, `#1A4747` text, `$120K`
- **X-axis:** Month abbreviations (Jan–Jul), active month bold
- **Y-axis:** Dollar amounts `$0` to `$750K`
- Chart height: `~260px`, with generous padding

### 5.5 Upcoming Appointment Panel (Right Column)
- **Calendar week strip:** 7 days, Sun–Fri
  - Day number: `18px` bold
  - Day label: `11px` muted
  - Active day (Wed 10): circle `#1A4747`, white text
- **Appointment cards:**
  - Style A (amber): bg `#FFCF44`, `border-radius: 12px`, icon + name + time range
  - Style B (cyan): bg `#3DD6D0`, `border-radius: 12px`, icon + name + time range
  - Avatar: `36px` circle, slight border
- **Add Schedule row:** `+ Add New Schedule`, muted text, dashed or subtle divider

### 5.6 Appointment Table (Center Bottom)
| Property | Value |
|---|---|
| Header row bg | `#F9FAFB` |
| Row height | `48px` |
| Row hover | `#F3F4F6` |
| Dividers | `1px solid #E8EDF2` |
| Checkbox | Custom styled, `border-radius: 4px` |
| Status badges | Pill shape, `border-radius: 999px`, colored text + bg |
| Action icons | Eye `👁`, Edit `✏️`, Delete `🗑` — `#9CA3AF`, hover darken |

### 5.7 Today's Topic Card (Dark)
- Position: bottom of left column
- Background: `#1A3A3A` with colorful abstract blob/gradient image overlay
- Text: `Today's Topic` pill label (small, white, semi-transparent bg)
- Headline text: white + yellow-green `#C8E04A` for emphasis word
- `border-radius: 16px`

---

## 6. Iconography

- **Style:** Outlined / Stroke icons (Lucide, Heroicons, or similar)
- **Size:** `18–20px` in nav, `20–22px` in cards
- **Stroke width:** `1.5px`
- **Icon backgrounds in stat cards:** `48px` circle, `bg: #F5F9C4`, icon color `#B5CC30` or teal

---

## 7. Border Radius Reference

| Element | Radius |
|---|---|
| Cards | `16px` |
| Buttons | `10–12px` |
| Nav active pill | `999px` |
| Status badges | `999px` |
| Chart bars | `8px` top-only |
| Appointment cards | `12px` |
| Avatar | `50%` |
| Icon circles | `50%` |
| Input/Search | `999px` |

---

## 8. Shadow Reference

| Context | Value |
|---|---|
| Card default | `0 2px 12px rgba(0,0,0,0.06)` |
| Card hover | `0 6px 24px rgba(0,0,0,0.10)` |
| Navbar | `0 1px 6px rgba(0,0,0,0.06)` |
| Active button | `0 4px 14px rgba(26,71,71,0.30)` |
| Tooltip/badge | `0 2px 8px rgba(0,0,0,0.12)` |

---

## 9. Page Background

- **Type:** Subtle radial/mesh gradient
- **Colors:** Soft teal `#B2D8D8` top-left → white center → soft rose `#F4C4C4` bottom-right
- **Implementation:**
```css
body {
  background: radial-gradient(ellipse at top left, #B2D8D8 0%, #F0F4F8 50%, #F4C4C4 100%);
  min-height: 100vh;
}
```

---

## 10. CSS Variables (Design Tokens)

```css
:root {
  /* Brand */
  --color-primary:        #1A4747;
  --color-accent:         #C8E04A;
  --color-teal-light:     #3DD6D0;
  --color-amber:          #FFCF44;

  /* Surfaces */
  --color-bg:             #F0F4F8;
  --color-card:           #FFFFFF;
  --color-card-dark:      #1A3A3A;
  --color-border:         #E8EDF2;

  /* Text */
  --color-text-primary:   #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted:     #9CA3AF;
  --color-text-inverse:   #FFFFFF;

  /* Status */
  --color-pending:        #F59E0B;
  --color-pending-bg:     #FEF3C7;
  --color-completed:      #06B6D4;
  --color-completed-bg:   #CFFAFE;

  /* Radius */
  --radius-card:          16px;
  --radius-btn:           10px;
  --radius-pill:          999px;

  /* Shadows */
  --shadow-card:          0 2px 12px rgba(0,0,0,0.06);
  --shadow-hover:         0 6px 24px rgba(0,0,0,0.10);

  /* Fonts */
  --font-heading:         'Plus Jakarta Sans', sans-serif;
  --font-body:            'DM Sans', sans-serif;

  /* Spacing base */
  --space-xs:             4px;
  --space-sm:             8px;
  --space-md:             16px;
  --space-lg:             24px;
  --space-xl:             32px;
}
```

---

## 11. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 768px` | Stack all columns vertically, collapse nav to hamburger |
| `768–1024px` | 2-column layout: stats left, chart + table right; hide appointment panel or move below |
| `> 1024px` | Full 3-column layout as designed |

---

## 12. Component States

| Component | Default | Hover | Active/Selected | Disabled |
|---|---|---|---|---|
| Nav item | transparent | bg `#F3F4F6` | bg `#C8E04A` | opacity `0.4` |
| Button (Export) | bg `#1A4747` | darken `10%` | scale `0.98` | opacity `0.5` |
| Table row | white | bg `#F9FAFB` | bg `#F0F4F8` | — |
| Status badge | static pill | — | — | — |
| Appointment card | colored bg | brightness `1.05` | — | — |

---

*Generated from UI screenshot analysis — Medica Healthcare Dashboard*
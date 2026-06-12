# Handoff: GlobalComix Panel Tracker

## Overview
GlobalComix is an **internal production tool** for a comic studio. It lets admins and artists track the status of individual comic panels across multiple chapters — covering two production stages per panel: **Style Frame** and **Video**. Users can log in, view chapter dashboards, drill into a full tracker table, manage panels via a detail modal, and administer user accounts.

---

## About the Design Files
The HTML/JSX files in this bundle are **hi-fidelity design references** built as a React prototype. They show intended look, layout, interactions, and copy — but are **not** production code to ship directly. The task is to **recreate these designs in your target codebase** (Next.js, React + Vite, etc.) using its established patterns, libraries, and data layer. The prototype uses hard-coded mock data; replace it with real API calls.

## Fidelity
**High-fidelity.** Pixel-precise colors, typography, spacing, hover states, and interaction flows are all finalised. Implement the UI pixel-for-pixel.

---

## Design Tokens

### Colors
```
Background:   #090909   (T.bg)
Surface:      #0f0f0f   (T.surf)   — nav bars, sidebars, headers
Card:         #161616   (T.card)
Card hi:      #1d1d1d   (T.cardHi)
Border:       #1e1e1e   (T.border)
Border hi:    #2c2c2c   (T.borderHi)
Text:         #e2e2e2   (T.text)
Muted:        #6a6a6a   (T.muted)
Dim:          #3a3a3a   (T.dim)
Accent blue:  #4d8ee8   (T.accent)
Accent low:   #0f2040   (T.accentLo)  — active sidebar bg
Accent mid:   #1a3a70   (T.accentMid) — active sidebar border, dashed borders
```

### Status badge colors
| Status      | Background | Border  | Text    |
|-------------|------------|---------|---------|
| Approved    | #041c0e    | #1a5228 | #22c55e |
| Review      | #1e1400    | #4a3600 | #fbbf24 |
| In Progress | #040f22    | #153060 | #60a5fa |
| Rejected    | #1a0404    | #4a1010 | #f87171 |
| Done        | #111111    | #262626 | #525252 |

### Role badge colors
| Role     | Color   |
|----------|---------|
| ADMIN    | #4d8ee8 |
| ARTIST   | #22c55e |
| REVIEWER | #fbbf24 |
All role badges use `color + "18"` fill and `color + "44"` border.

### Typography
- **Font:** `JetBrains Mono` (monospace), all weights — Google Fonts CDN
- All text uses this single font family
- Common sizes: 9px labels (uppercase, letterspacing 1–1.5), 10–11px body/secondary, 12px default, 13–14px nav/headings, 20px page titles, 32px stat numbers

### Spacing & shape
- Border radius: 3–4px inputs/small elements, 5–7px cards, 8–10px modals/larger cards, 99px badge pills, 50% avatars
- Card shadows: login `0 32px 80px rgba(0,0,0,.7)`, modal `0 40px 120px rgba(0,0,0,.85)`
- Global scrollbar: 5px, thumb `#2a2a2a` (hover `#3a3a3a`), transparent track

---

## Screens / Views

### 1. Login Screen
**Purpose:** Authenticate users before entering the app.

**Layout:**
- Full viewport, `background: #090909`
- Radial gradient overlay: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(77,142,232,.07) 0%, transparent 70%)`
- Centered card: `width: 380px`, `padding: 44px 40px`, `border-radius: 12px`, card background, `box-shadow: 0 32px 80px rgba(0,0,0,.7)`

**Components:**
- Logo: `GLOBALCOMIX` — 16px, weight 700, letter-spacing 4, uppercase; subtitle `Panel Tracker · Production Tool` 10px muted; 40px wide 1px border divider below
- Two inputs: Username (text), Password (password) — full width, standard `.gc-input` style
- Error state: red `#f87171` text on `rgba(248,113,113,.08)` bg with matching border, shown inline
- Submit button: full width, 10px padding, 13px weight 600, primary accent style; shows `Signing in…` while loading
- Footer: `Internal use only · GlobalComix Studio` — dim 9px

**Interactions:**
- Enter key submits form
- Username `admin` → role `ADMIN`; any other username → role `ARTIST`
- 600ms loading delay before transition to Dashboard

---

### 2. App Shell — Sidebar Layout (Dashboard + Admin)
**Purpose:** Persistent navigation wrapper for Dashboard and Admin screens.

**Layout:** Full viewport flex column:
1. **Breadcrumb top bar** (44px tall, surface bg, bottom border)
   - Tab nav: Dashboard / Tracker / Admin — active tab has bottom `2px solid #4d8ee8`, white text; inactive muted
   - Right: user role label (dim, 10px) + avatar (28px, clickable → Login)
2. **Body row** (flex, fills remaining height):
   - **Sidebar** (220px wide, surface bg, right border) — see below
   - **Main content** (flex:1) — Dashboard or Admin screen

**Sidebar structure (top → bottom):**
- Logo block (padding 16px 18px): `GLOBALCOMIX` 13px bold, letterspacing 3; subtitle `Global Comix Project` 9px muted uppercase
- Chapter list (padding 12px 10px): section label `CHAPTERS`; each chapter item has name, panel count badge, progress bar
  - Active chapter: `T.accentLo` background, `T.accentMid` border, white text, blue progress bar
  - Inactive: transparent bg, muted text
- `+ Add Chapter` link in accent color
- Divider + `NAVIGATE` section: Dashboard and Tracker nav items (same active/inactive treatment)
- Footer: user avatar (28px) + display name (11px, 500) + role (9px muted uppercase) + ⚙ User Management link

---

### 3. Dashboard Screen
**Purpose:** Chapter-level overview of panel production status.

**Layout:** Flex column, scrollable main area with `padding: 20px 28px`:

**Page header** (surface bg, bottom border, padding 20px 28px 16px):
- Left: chapter name (20px, 700) + panel count (13px muted inline); subtitle (10px muted)
- Right: `Open Tracker →` primary button

**Stats row** — 5 equal flex cards with `gap: 12px`:
| Stat | Value | Color |
|------|-------|-------|
| Total Panels | 42 | T.text |
| Approved | 18 | #22c55e |
| In Progress | 12 | #60a5fa |
| Review | 8 | #fbbf24 |
| Rejected | 4 | #f87171 |
- Each card: `padding: 14px 16px`, 2px colored left accent bar (absolute), large number (32px, 700), label (11px, 500), subtitle (9px muted uppercase)

**Progress bar card** — single full-width card:
- Header row: "Chapter Progress" label (9px uppercase) + percentage right
- Segmented bar (6px height): green 43% / blue 29% / amber 19% / red 9% (no gaps, border-radius on ends only)
- Legend below with 6×6px color squares

**All Chapters** — 3 equal flex cards:
- Chapter name (13px 600), panel count (10px muted), `Open` small button
- 4px segmented progress bar
- Badge chips for Approved / In Progress / Review + counts

**Recent Activity** — grid of panel thumbnail cards (`width: 136px`):
- Striped placeholder image (100×80px)
- Panel name in accent (11px 500)
- Status badge

---

### 4. Tracker Screen
**Purpose:** Full panel-by-panel production tracking table with filter/search.

**Layout:** Full width/height flex column, `overflow: hidden`

**Toolbar** (surface bg, bottom border, padding 8px 16px):
- Chapter title (14px 600) + panel count `— N/M panels` (dim 11px)
- Right side: search input (170px), status filter select (120px), artist filter select (110px), Export button, `+ Panel` primary button

**Table** — sticky double-header, `tableLayout: fixed`:

Column widths:
```
STT: 44px | Panel Name: 216px | Origin: 68px
Style Frame group: Assigned 96px | Old 68px | New 68px | Status 104px
Video group: Assigned 96px | Old 68px | New 68px | Status 104px
Actions: 44px
```

Header row 1: STT, Panel Name, Origin (rowspan 2) + grouped headers "STYLE FRAME" (colspan 4) and "VIDEO" (colspan 4) — group headers use `T.accentLo` bg, `T.accent` text, 9px uppercase 600
Header row 2: Assigned, Old, New, Status × 2

Row behavior:
- Alternating row colors: even `T.bg (#090909)`, odd `#0c0c0c`
- Hover → `#181818`
- Full row click → opens Panel Detail Modal
- Panel name: accent color, 11px 500, letterspacing 0.3
- Origin, Old, New columns: `ImgThumb` component (52×34px, striped if has image, `+` placeholder if not)
- Assigned columns: 20px avatar + name (11px muted)
- Status columns: `Badge` component
- Actions column (last): `···` in muted (16px)

**Empty state:** centered `No panels match the current filter.` in dim 13px

**Pagination footer** (bottom border, padding 10px 16px): count label left, Prev/Next small buttons right

**Filter logic:**
- Status filter matches if panel's `sf_s` OR `vid_s` equals the selected status
- Artist filter matches if panel's `sf_a` OR `vid_a` equals selected artist
- Search filters on panel name (case-insensitive substring)

---

### 5. Panel Detail Modal
**Purpose:** View and edit all details of a single panel — assignment, status, and image uploads for both Style Frame and Video stages.

**Layout:** Fixed overlay (`z-index: 1000`), `rgba(0,0,0,0.78)` backdrop with `backdrop-filter: blur(6px)`. Click outside to close.

**Modal card:** `width: 900px`, `max-height: 92vh`, card bg, `border-radius: 10px`, `box-shadow: 0 40px 120px rgba(0,0,0,.85)`

**Header** (surface bg, bottom border, padding 12px 20px):
- Panel name (accent, 14px 600) + chapter/panel subtitle (10px muted)
- Current Style Frame `Badge` status
- `✕ Close` button (border, muted)

**Body** (flex row, padding 18px 20px, overflow auto):

Left column (`width: 200px`, shrink 0):
- Label "Origin Comic" (9px uppercase muted)
- 200×290px striped placeholder with gradient overlay (bottom fade to black)
- "↺ Replace" small button below

Right area (flex:1): two stacked `SectionForm` blocks — "STYLE FRAME" and "VIDEO"

**SectionForm** (border, 7px radius, `T.bg` background, padding 14px):
- Section title: accent, 11px 600, letterspacing 1.2, uppercase
- Top row: "Assigned To" select (flex:1) + "Status" select (136px wide)
- Image row: "Old Version" + "New Version" upload slots (136×100px each)
  - Has image: striped pattern, dashed `T.borderHi` border
  - Empty: `+` icon in `T.accentMid`, dashed `T.accentMid` border, hover → blue border + `#0f2040` bg

**Footer** (surface bg, top border, padding 10px 20px): Cancel + `Save Changes` primary — right-aligned

**Save behavior:** updates the panel in the tracker table, closes modal

---

### 6. Admin / User Management Screen
**Purpose:** Create and manage studio user accounts.

**Layout:** Scrollable content, `padding: 24px 32px`, `T.bg` background

**Page header:** "User Management" (20px 700) + subtitle showing count + tech notes; `+ Add User` primary button right-aligned

**Users table** (card bg, `border-radius: 8px`, overflow hidden):
Columns: `#` | Display Name | Username | Role | Status | Joined | Actions

- Row styles: even `T.card`, odd `T.bg`; hover `#181818`
- Display Name cell: 28px avatar + name
- Role cell: pill badge using role color (see token table above)
- Status cell: colored dot (6px circle) + "Active" / "Inactive" text
- Joined: placeholder dates `2025-0N`
- Actions: `Edit` small button + `Disable`/`Enable` small button (not shown for ADMIN role)

**Add User form** (shown inline below table on button click):
- Dashed `T.accentMid` border, 8px radius, padding 20px, max-width 420px
- Fields: Display Name, Username, Password (text inputs), Role (select: ARTIST / REVIEWER / ADMIN)
- Validation: all fields required; inline red error message
- Buttons: Cancel + Create User (primary)
- On create: appends to users list, resets form, hides panel

---

## Interactions & Behavior

### Navigation / Routing
The app has a simple screen-based router (no URL routing in the prototype):
- `login` → `dashboard` on successful sign-in
- Top breadcrumb bar + sidebar both navigate between `dashboard`, `tracker`, `admin`
- In Tracker layout, a `← Dashboard` back button replaces the sidebar; top nav shows chapter tabs
- Avatar click → logout (return to `login`)

### Hover / Active States
All interactive elements use CSS class helpers:
- `.gc-btn:hover` → `filter: brightness(1.15)` + primary hover adds `box-shadow: 0 0 14px rgba(77,142,232,.35)`
- `.gc-btn:active` → `filter: brightness(0.9)`
- `.gc-nav-tab:hover` → text color `#e2e2e2`
- `.gc-sidebar-item:hover` → `background: rgba(255,255,255,.04)`
- `.gc-row:hover` (table rows) → `background: #181818`
- `.gc-upslot:hover` (upload slots) → `border-color: #4d8ee8`, `background: #0f2040`

### Transitions
- Screen entrance: `gc-fade-in` animation — `opacity: 0` + `translateY(4px)` → normal, 0.2s ease-out
- Buttons: `filter` + `box-shadow` transition 0.15s
- Nav tabs: `color` transition 0.12s
- Sidebar items: `background` + `border-color` 0.1s
- Inputs: `border-color` + `box-shadow` 0.15s; focus ring `0 0 0 3px rgba(77,142,232,.1)`

### Input / Form styles (global)
```css
background: #161616;
border: 1px solid #2c2c2c;
color: #e2e2e2;
font-family: 'JetBrains Mono', monospace;
font-size: 12px;
padding: 7px 10px;
border-radius: 4px;
```
Focus: `border-color: #4d8ee8` + focus ring above.
Select: custom arrow via inline SVG background-image, `padding-right: 28px`.

---

## State Management
| State variable | Lives in | Purpose |
|---|---|---|
| `screen` | App root | Active screen: `login`, `dashboard`, `tracker`, `admin` |
| `user` | App root | `{ name: string, role: 'ADMIN' \| 'ARTIST' }` |
| `activeChapter` | App root | 0-indexed active chapter (0–2) |
| `panels` | TrackerScreen | Array of panel objects (sourced from API in production) |
| `selectedPanel` | TrackerScreen | Panel currently open in modal, or null |
| `statusFilter` | TrackerScreen | Selected status filter value |
| `artistFilter` | TrackerScreen | Selected artist filter value |
| `search` | TrackerScreen | Search string |
| `users` | AdminScreen | Array of user objects |
| `showForm` | AdminScreen | Toggle add-user form visibility |

---

## Data Model

### Panel object
```ts
{
  id:       number,
  stt:      string,   // zero-padded sequence, e.g. "001"
  name:     string,   // e.g. "MAGMEL_CHAP1_PANEL001"
  sf_a:     string,   // Style Frame assigned artist name
  sf_s:     StatusValue,
  sf_old:   boolean,  // has old version image uploaded
  sf_new:   boolean,  // has new version image uploaded
  vid_a:    string | null,
  vid_s:    StatusValue,
  vid_old:  boolean,
  vid_new:  boolean,
}

type StatusValue = 'Review' | 'In Progress' | 'Approved' | 'Rejected' | 'Done'
```

### User object
```ts
{
  id:     number,
  name:   string,   // display name
  user:   string,   // login handle
  role:   'ADMIN' | 'ARTIST' | 'REVIEWER',
  active: boolean,
}
```

---

## Assets
- **JetBrains Mono** — Google Fonts, all weights. CDN: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap`
- **Panel images / origin comic images** — placeholder stripes in prototype. Replace with real image URLs from the CMS/storage layer.
- **No icons or SVGs** — all indicators are CSS shapes (dots, dividers) or Unicode characters (`⊟`, `⊞`, `⚙`, `···`, `✕`, `←`, `→`, `↓`, `↺`, `+`).

---

## Files in this bundle
| File | Purpose |
|------|---------|
| `GlobalComix App.html` | Entry point — loads all component scripts, global styles, scrollbar + hover CSS |
| `gc-components.jsx` | Design tokens (`T`, `SC`, `AV_COLORS`), primitives (`Badge`, `Av`, `Btn`, `ImgThumb`), `TopNav`, `Sidebar` |
| `gc-screens.jsx` | `LoginScreen`, `DashboardScreen`, `AdminScreen` |
| `gc-tracker.jsx` | `TrackerScreen`, `PanelModal`, mock `PANELS` data |
| `gc-main.jsx` | Root `App` component — routing, layout shells, `ReactDOM.createRoot` |
| `GlobalComix Wireframes.html` | Earlier wireframe exploration (reference only) |

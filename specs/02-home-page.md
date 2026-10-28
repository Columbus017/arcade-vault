# SPEC 02 — Home Page

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-10-23
> **Objective:** Implement the Arcade Vault landing page at `/` from `references/templates/home-about/home.jsx`, move the Library to `/biblioteca`, and update the Nav to match the new template.

## Scope

**In:**

- Home page at `/` (`app/page.tsx`), ported from `references/templates/home-about/home.jsx`. Sections: hero with floating pixel silhouettes, "¿Por qué Arcade Vault?" feature grid, available games rail (first 6 of `GAMES`), stats band, live activity (latest scores + top players), pricing with FAQ, final CTA.
- Library moved from `/` to `/biblioteca` (`app/biblioteca/page.tsx`), content unchanged.
- `components/Nav.tsx` updated to match `references/templates/home-about/nav.jsx`: "Inicio" link to `/`, "Biblioteca" link to `/biblioteca`, "CRÉDITOS · 03" coin counter, and the mobile panel with the same entries. The "Acerca de" link is omitted (desktop and mobile panel) until the About spec lands.
- Active-link logic: "Biblioteca" stays active on `/biblioteca` and `/juegos/*`.
- Scroll-reveal animation (IntersectionObserver) on home sections.
- Static mock data for latest scores, top players, features, stats and pricing FAQ, as in the template. The "12+ JUEGOS" stat stays hardcoded.
- Only the new home rules from `references/templates/home-about/styles.css` merged into `app/globals.css`. Existing rules untouched.
- CTAs as in the template:
  - "EXPLORAR JUEGOS" and "VER TODOS LOS JUEGOS" → `/biblioteca`.
  - "CREAR CUENTA" and "EMPEZAR GRATIS" → `/auth`.
  - "INSERTAR MONEDA" → `/biblioteca`.
  - Game mini-cards → `/juegos/[id]`.
  - "VER SALÓN" → `/salon`.
- Internal links updated to the new Library route (any link to `/` that meant Library). The `/auth` post-login redirect stays at `/`, which now lands on Home.

**Out of scope (for future specs):**

- About and Contact page (`about.jsx`), deferred to its own spec.
- Real data for activity, top players or stats (no backend).
- Hiding auth CTAs when a user is logged in.
- Computing the games count from `GAMES.length`.
- Automated tests.

## Data model

```ts
// lib/home.ts
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export interface Feature {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: NeonColor;
}

export interface HomeStat {
  n: string;   // "12+", "MILES", "GLOBAL"
  unit: string;
  sub: string;
}

export interface ActivityRow {
  player: string;
  game: string;   // display title, as in the template
  score: number;
  when: string;   // "hace 2 min"
  color: NeonColor;
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface FaqItem {
  q: string;
  a: string;
}

export const FEATURES: Feature[];
export const HOME_STATS: HomeStat[];
export const RECENT_ACTIVITY: ActivityRow[];   // 7 rows
export const TOP_PLAYERS_TODAY: TopPlayer[];   // 5 rows
export const PRICING_FEATURES: string[];       // 6 list items
export const PRICING_FAQ: FaqItem[];           // 3 items
```

Conventions:

- All values are ported verbatim from `home.jsx`, in Spanish.
- The "available games" rail reuses `GAMES` from `lib/games.ts` (`slice(0, 6)`). No new game data.
- No `localStorage` keys added.
- Pixel silhouettes and feature icons are SVG components, not data, and live in the components.

## Implementation plan

1. Add `lib/home.ts` with the types and the six constants from the data model, ported verbatim from `home.jsx`. No UI changes.
2. Merge the home-only rules from `references/templates/home-about/styles.css` into `app/globals.css` (`.home-*`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.ticker`, `.top-*`, `.price-*`, `.faq-*`, `.final-*`, `.reveal`, `.silo*`). Existing rules are untouched. Manual check: every existing route renders as before.
3. Move the Library to `/biblioteca`: `git mv` the Library content from `app/page.tsx` to `app/biblioteca/page.tsx`. Update internal links that meant Library (for example the Detail "back" links and any `href="/"` on cards or breadcrumbs). `app/page.tsx` temporarily does `redirect("/biblioteca")`. Manual check: `/` lands on the Library and `/biblioteca` renders it.
4. Update `components/Nav.tsx` to match `nav.jsx`: "Inicio" → `/`, "Biblioteca" → `/biblioteca`, "Salón de la Fama" → `/salon`, no "Acerca de". Add the "CRÉDITOS · 03" counter in the desktop bar and the mobile panel footer. "Biblioteca" is active on `/biblioteca` and `/juegos/*`, "Inicio" only on `/`. Manual check: the links work and the active state is correct on each route.
5. Add `components/home/FloatingSilhouettes.tsx`, `components/home/Hero.tsx` and `hooks/useReveal.ts` (IntersectionObserver adding `.in` to `.reveal` elements). Replace the redirect in `app/page.tsx` with the Home page rendering only the hero. Manual check: `/` shows the hero; "EXPLORAR JUEGOS" goes to `/biblioteca` and "CREAR CUENTA" goes to `/auth`.
6. Add `components/home/FeatureGrid.tsx` (with `FeatureIcon`), `components/home/GamesRail.tsx` (reusing `GAMES.slice(0, 6)`) and `components/home/StatsBand.tsx`. Render them in `app/page.tsx` after the hero. Manual check: sections 01 and 02 and the stats band reveal on scroll, mini-cards go to `/juegos/[id]`, and "VER TODOS LOS JUEGOS" goes to `/biblioteca`.
7. Add `components/home/ActivitySection.tsx` (latest scores ticker plus top players list, from `RECENT_ACTIVITY` and `TOP_PLAYERS_TODAY`). Render it in `app/page.tsx`. Manual check: 7 ticker rows, 5 top rows with rank styling for the top 3, and "VER SALÓN" goes to `/salon`.
8. Add `components/home/PricingSection.tsx` (price card plus FAQ) and `components/home/FinalCta.tsx`. Render both in `app/page.tsx`. Manual check: "EMPEZAR GRATIS" goes to `/auth` and "INSERTAR MONEDA" goes to `/biblioteca`.
9. Final pass: confirm no leftover references to the old Library-at-`/` behavior, check the console on `/`, `/biblioteca`, `/juegos/[id]`, `/salon` and `/auth`, and spot-check the responsive breakpoints from the template's `styles.css`.

## Acceptance criteria

- [x] `/` renders the Home page with all sections in order: hero, "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA", stats band, "ACTIVIDAD EN VIVO", "PRECIOS", final CTA.
- [x] The hero shows the title "EL ARCADE CLÁSICO ESTÁ DE VUELTA", the 8 floating silhouettes, and the "EXPLORAR JUEGOS" and "CREAR CUENTA" buttons.
- [x] The feature grid renders 4 cards: JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO.
- [x] The games rail renders exactly 6 mini-cards, taken from the first 6 entries of `GAMES`.
- [x] Clicking a mini-card navigates to `/juegos/[id]` for that game.
- [x] The stats band renders "12+", "MILES" and "GLOBAL" blocks.
- [x] "ÚLTIMAS PUNTUACIONES" renders 7 rows and "TOP JUGADORES · HOY" renders 5 rows, with `top1`, `top2` and `top3` classes on the first three.
- [x] Scores are formatted with `es-ES` thousands separators (for example `184.220`).
- [x] Sections with the `.reveal` class gain the `.in` class when they scroll into view.
- [x] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" and "INSERTAR MONEDA" navigate to `/biblioteca`.
- [x] "CREAR CUENTA" and "EMPEZAR GRATIS" navigate to `/auth`, including when a fake user is logged in.
- [x] "VER SALÓN →" navigates to `/salon`.
- [x] The pricing card shows "$0 / SIEMPRE", 6 list items and 3 FAQ entries.
- [x] `/biblioteca` renders the same Library screen that `/` rendered before this spec (search, category chips, card grid).
- [x] Library search and category filtering still work on `/biblioteca`.
- [x] The Nav shows Inicio, Biblioteca and Salón de la Fama, with no "Acerca de" link on desktop or in the mobile panel.
- [x] The Nav shows "CRÉDITOS · 03" on desktop and in the mobile panel footer.
- [x] "Inicio" is active only on `/`. "Biblioteca" is active on `/biblioteca` and on `/juegos/*`.
- [x] Below 840px, the Nav collapses to the hamburger and opens the mobile panel.
- [x] After login via `/auth`, the redirect lands on `/` (Home) and the Nav shows the username.
- [x] No link in the app points to `/` expecting the Library.
- [x] Existing screens (`/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/auth`) render unchanged after the CSS merge.
- [x] No console errors on `/`, `/biblioteca`, `/juegos/[id]`, `/salon` and `/auth`.
- [x] `npm run build` completes with no TypeScript or ESLint errors.

## Decisions

- **Yes:** Home at `/`, Library moves to `/biblioteca`. Matches the template nav (Inicio / Biblioteca) and gives the site a real landing page.
- **No:** Home at `/home` with Library staying at `/`. Leaves the root URL as a catalog and diverges from the template's navigation.
- **Yes:** split About and Contact into its own spec. Keeps this spec to one page; `about.jsx` has its own form and states.
- **Yes:** omit the "Acerca de" Nav link until the About spec lands. Avoids a dead link and a 404.
- **Yes:** update `Nav.tsx` to match the new `nav.jsx` (Inicio link, coin counter). Keeps the Nav consistent with the new template.
- **Yes:** merge only the new home rules into `app/globals.css`. Avoids overwriting SPEC 01 styles that already work.
- **Yes:** static mock data in `lib/home.ts` for activity, top players, features, stats and FAQ, as in the template. No backend exists, and deriving from `seededScores` would add logic with no benefit.
- **Yes:** keep "12+ JUEGOS" hardcoded, as in the template. It is a marketing claim, not a count.
- **No:** compute the games count from `GAMES.length`. It is 8 today, so the claim would change and break the design.
- **Yes:** keep "CREAR CUENTA" and "EMPEZAR GRATIS" visible when a user is logged in, as in the template. Hiding them needs the user context on a page that is otherwise static.
- **Yes:** temporary `redirect("/biblioteca")` at `/` during step 3, replaced in step 5. Keeps the app functional between commits.
- **Yes:** one component per home section under `components/home/`. Keeps each file small and each step commitable.

## Risks

| Risk | Mitigation |
| --- | --- |
| Merged home CSS rules collide with class names already in `app/globals.css` (for example `.kicker`, `.section-title`, `.btn.xl`) and change existing screens. | Before merging, diff the template's selectors against `globals.css`. Add only selectors that don't exist yet. If a name collides, rename it with a `home-` prefix. |
| `.reveal` sections start hidden and only appear once `useReveal` runs, so they stay invisible if the observer never fires (JS disabled, or elements already in view on load). | The observer runs on mount and also catches elements already in the viewport. Verify at load that the first sections show without scrolling. |
| `toLocaleString("es-ES")` can output different separators between server and client, causing a hydration mismatch. | Format scores in a single shared helper and check the console for hydration warnings in the final pass. |
| Moving the Library to `/biblioteca` breaks hardcoded links or redirects that assumed `/` (Detail "back" links, `/auth` redirect). | Step 3 greps for `href="/"` and `router.push("/")`. The `/auth` redirect to `/` is kept on purpose, so it now lands on Home. |

## What is **not** in this spec

- About and Contact page (`about.jsx`) and the "Acerca de" Nav link.
- Real data for activity, top players or stats (no backend).
- Hiding "CREAR CUENTA" / "EMPEZAR GRATIS" when a user is logged in.
- Computing the games count from `GAMES.length`.
- Automated tests.

Each one of those, if it lands, goes in its own spec.

# SPEC 01 — MVP Visual Screens

> **Status:** Implemented
> **Depends on:** None (first spec of the project)
> **Date:** 2026-07-28
> **Objective:** Implement the 5 Arcade Vault visual screens defined in `references/templates/` (Library, Detail, Player, Hall of Fame, Auth) as Next.js routes with mock data and client-side UI interactivity, without any playable game logic.

## Scope

**In:**

- 5 routes built with Next.js App Router: `/` (Library), `/juegos/[id]` (Detail), `/juegos/[id]/jugar` (Player), `/salon` (Hall of Fame), `/auth` (Auth).
- Shared `Nav` component (desktop links + mobile slide-out panel) reproducing `references/templates/nav.jsx`.
- Mock game catalog data (from `references/templates/data.jsx`) ported into a typed TS module, used to render the Library grid, Detail page, and Player HUD.
- Deterministic mock leaderboard rows (ported `seededScores` generator) for Detail and Hall of Fame.
- Working client-side UI interactivity: search + category filter in Library, tabs in Hall of Fame and Auth, mobile nav toggle, hover/tilt on game cards.
- Fake auth flow: login/signup/guest forms that accept any input, persisted to `localStorage` (`av_user`) so the Nav reflects logged-in state across reloads.
- Static/decorative Player (CRT) screen: fixed example HUD values (score, lives, level), decorative CSS "game arena" background, pause overlay toggle, and a manually-triggered game-over modal (via the "FIN" button) using a fixed example score.
- "Save score" action in the game-over modal writes to `localStorage` (`av_scores`) and shows the saved toast, matching the template's fake-persistence behavior.
- Responsive layout matching the breakpoints already defined in `app/globals.css`.

**Out of scope (for future specs):**

- Any real, playable game (Bloque Buster, Caída, Serpentina, etc.) — the Player screen is decorative only.
- Real backend/API, real authentication, or real score submission/validation.
- Real per-game leaderboards backed by actual gameplay data.
- Account management beyond the fake login/logout (password reset, profile editing, social OAuth actually working).
- Automated tests (none configured in this project yet).

## Data model

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;   // CSS class name, e.g. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[] = [ /* 8 entries ported from references/templates/data.jsx */ ];
export const CATS: ("TODOS" | GameCategory)[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // DD/MM/YYYY
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// lib/auth.ts
export interface FakeUser {
  name: string;
}

export interface ScoreEntry {
  game: string; // Game.id
  score: number;
  name: string;
  at: number;   // Date.now()
}
```

`localStorage` keys (unchanged from the template):

- `av_user` — `FakeUser | null`, JSON-encoded.
- `av_scores` — `ScoreEntry[]`, JSON-encoded.

Conventions:

- `Game.id` is the kebab-case slug used in the `/juegos/[id]` route param.
- `Game.cover` and `Game.color` map directly to CSS classes already defined in `app/globals.css` (`.cover-*`, `.btn.magenta`/`.yellow`, etc.) — no new styling needed.

## Implementation plan

1. Add `lib/games.ts` — port the `GAMES` catalog, `CATS`, `ScoreRow` type, and the `seededScores()` generator from `references/templates/data.jsx`. No UI changes yet.
2. Add `lib/auth.ts` — `FakeUser`/`ScoreEntry` types plus small `localStorage` helpers (`getStoredUser`, `setStoredUser`, `clearStoredUser`, `pushStoredScore`).
3. Add `components/UserProvider.tsx` (client component) wrapping `{children}` in `app/layout.tsx` — holds `user: FakeUser | null` state initialized from `localStorage`, exposes `login`/`logout` via React Context. App still renders the default scaffold page, now wrapped by the provider.
4. Add `components/Nav.tsx` (client component), porting `nav.jsx` — desktop links + mobile slide-out panel, using `next/link` and `usePathname` for the active-link state, and the `UserProvider` context for the login/logout button. Render it in `app/layout.tsx` above `{children}`. Every route now shows the real Nav.
5. Replace `app/page.tsx` with the Library screen, porting `biblioteca.jsx` — hero, search + category-filter bar (client state), `GameCard` grid reading from `lib/games.ts`, cards linking to `/juegos/[id]`.
6. Add `app/juegos/[id]/page.tsx` — Detail screen, porting `detalle.jsx`: game info, stat strip, leaderboard via `seededScores`, "PLAY NOW" linking to `/juegos/[id]/jugar`, `notFound()` for unknown ids.
7. Add `app/juegos/[id]/jugar/page.tsx` — Player screen (client component), porting `reproductor.jsx` **without** the score-incrementing interval or enemy-drift loop: fixed example HUD values, decorative CRT/game-arena background, pause-overlay toggle, and the "FIN" button opening the game-over modal with a fixed example score. "SAVE SCORE" writes a `ScoreEntry` via `pushStoredScore` and shows the saved toast.
8. Add `app/salon/page.tsx` — Hall of Fame screen, porting `salon.jsx`: game tabs, podium, ranking table via `seededScores`, "your best score" row shown when a fake user is logged in (from context).
9. Add `app/auth/page.tsx` — Auth screen, porting `auth.jsx`: sign-in/sign-up tabs, guest button, calling `login()` from context then redirecting to `/`.
10. Final pass: remove leftover `create-next-app` boilerplate, verify every route renders with no console errors, and spot-check the responsive breakpoints already defined in `app/globals.css` (840px nav, 900px detail, 720px hall/table).

## Acceptance criteria

- [x] `/` renders the Library screen with the hero, search input, category chips, and a card grid built from `lib/games.ts`.
- [x] Typing in the Library search input filters the grid by title (case-insensitive); no results shows the "NO RESULTS" empty state.
- [x] Clicking a category chip filters the grid to that category; "TODOS" shows all games.
- [x] Clicking a game card or its "PLAY" button navigates to `/juegos/[id]` for that game.
- [x] `/juegos/[id]` renders the game's cover, description, stat strip, and a 10-row leaderboard from `seededScores`.
- [x] `/juegos/unknown-id` returns a Next.js not-found response.
- [x] "PLAY NOW" on the Detail screen navigates to `/juegos/[id]/jugar`.
- [x] `/juegos/[id]/jugar` renders the CRT frame with fixed example HUD values (player, score, lives, level) and no score value changes on its own over time.
- [x] Clicking "PAUSE" on the Player screen shows the "EN PAUSA" overlay; clicking it again ("RESUME") hides it.
- [x] Clicking "FIN" on the Player screen opens the game-over modal with a fixed example final score.
- [x] Entering initials and clicking "SAVE SCORE" in the game-over modal writes an entry to `localStorage` under `av_scores` and replaces the input with the "▸ SCORE SAVED_" toast.
- [x] Clicking "PLAY AGAIN" in the game-over modal closes it and resets the Player screen to its fixed initial HUD values.
- [x] `/salon` renders a podium (top 3) and a ranking table for the selected game tab; switching tabs changes both to a different `seededScores` result.
- [x] `/auth` renders sign-in/sign-up tabs; submitting either form, or clicking "PLAY AS GUEST", logs the user in (or sets guest) and redirects to `/`.
- [x] After logging in via `/auth`, the Nav's auth button shows the entered username instead of "SIGN IN".
- [x] Reloading the page after logging in keeps the user logged in (Nav still shows the username), because `av_user` persisted in `localStorage`.
- [x] Clicking the logged-in Nav button signs the user out and the Nav reverts to "SIGN IN".
- [x] On `/salon`, a "your best score in [game]" row appears in the table only when a fake user is logged in.
- [x] Below 840px width, the Nav collapses to a hamburger button that opens the mobile slide-out panel.
- [x] `npm run build` completes with no TypeScript or ESLint errors.

## Decisions

- **Yes:** real Next.js App Router routes (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/auth`) instead of the template's hash-based SPA router. Fits the project's actual framework and gives real URLs/back-button behavior for free.
- **Yes:** a `UserProvider` React Context (client component) wrapping the root layout to share the fake logged-in user between `Nav`, `/auth`, `/salon`, and `/juegos/[id]/jugar`. The template could do this with simple prop-drilling because it was a single-component SPA; separate route files can't share state without a provider.
- **Yes:** `localStorage` fake-persistence for both the session (`av_user`) and saved scores (`av_scores`), matching the template. Cheap to implement and preserves the intended UX (Nav remembers you, scores "save") without a real backend.
- **No:** the Player screen's score-incrementing `setInterval` / drifting-enemy game loop. The spec explicitly excludes any playable game; a fake score ticking up would misrepresent the screen as a working game.
- **Yes:** keep the "FIN" button and game-over modal on the Player screen, using a fixed example score. It's decorative but lets every screen state (including game-over) be reachable and reviewable.
- **Yes:** port `data.jsx`'s mock catalog and `seededScores()` generator as-is into typed `lib/games.ts`. The data shape is already concrete and matches every screen; no reason to redesign it.
- **No:** any real backend, API route, or database. Out of scope per the spec's objective — visual screens only.
- **No:** automated tests for this spec. None are configured in the project yet, and adding a test runner is a separate concern from porting the visual templates.

## Risks

| Risk | Mitigation |
| --- | --- |
| `UserProvider` reads `localStorage` on mount, but SSR always renders `user = null` first — logged-in visitors briefly see "SIGN IN" before hydration updates the Nav. | Accept the brief flash for this MVP (documented behavior, not a bug); note it as a candidate fix in a future spec if it needs eliminating (e.g. a cookie-based initial value). |
| `localStorage` unavailable (private browsing, disabled storage) breaks `UserProvider`/`pushStoredScore`. | Wrap reads/writes in `try/catch`, matching the template's own defensive pattern — login/save simply won't persist, rest of the UI still works. |
| Card cover art and category colors are driven by CSS classes (`cover-bricks`, `.btn.magenta`, etc.) tied 1:1 to each game's `id` — a typo in `lib/games.ts` silently renders a blank cover. | Port `GAMES` directly from `references/templates/data.jsx` values rather than retyping them by hand. |

## What is **not** in this spec

- Any real, playable game (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel).
- Real backend/API, real authentication, or real score validation.
- Real per-game leaderboards backed by actual gameplay.
- Account management beyond fake login/logout (password reset, profile editing, working social OAuth).
- Automated tests.

Each one of those, if it lands, goes in its own spec.

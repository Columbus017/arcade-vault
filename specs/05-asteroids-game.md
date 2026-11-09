# SPEC 05 — Asteroids playable game

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-1-09
> **Objective:** Port the vanilla-canvas Asteroids from `references/started-games/02-asteroids/` to a TypeScript engine, add it to the catalog as a new game `asteroids`, and make it playable at `/juegos/asteroids/jugar` inside the existing player screen.

## Scope

**In:**

- New catalog entry in `lib/games.ts`: id `asteroids`, title `ASTEROIDS`, cat `SHOOTER`, new cover class `cover-asteroids` in `app/globals.css`. `rocas` is untouched.
- Pure TS engine in `lib/games/asteroids/` (no React). Ported from `game.js`: Bullet, Asteroid, PowerUp (3x triple shot), Ship, Particle, collisions, levels, lives, wrap-around.
- Engine draws only the playfield on a canvas. It exposes `{ score, lives, level, tripleShot, status }` via callbacks and `pause()`, `resume()`, `restart()`, `destroy()`.
- Canvas component `components/games/AsteroidsCanvas.tsx`: client component, fixed 800×600 internal resolution, scaled with CSS to fit the CRT container. Cleans up the rAF loop and key listeners on unmount.
- Engine registry `lib/games/registry.ts` (`gameId → component`). `PlayerScreen` renders the real game for registered ids and keeps the mock arena for the rest.
- `PlayerScreen` HUD (score, lives, level, 3x timer), PAUSA, FIN and the game-over modal driven by real engine state. Game over opens the existing modal, "GUARDAR PUNTUACIÓN" calls `pushStoredScore({ game: "asteroids", ... })`, "JUGAR DE NUEVO" restarts the engine.
- Keyboard controls: arrows rotate and thrust, Space shoots. Space and arrow keys call `preventDefault` while playing, so the page does not scroll.
- Auto-pause when the tab loses focus (cap on `dt` stays at 50 ms).

**Out of scope (for future specs):**

- Touch / mobile controls.
- Sound and music.
- UFOs, new enemies or new power-ups (the game has only the 3x triple shot).
- Saving scores to Supabase, leaderboard (`/salon`) changes.
- Real games for the other 7 catalog entries, including `rocas`.
- Changing `best` / `plays` stats from real play data.
- Gamepad support.
- Automated tests.

## Data model

```ts
// lib/games.ts — new entry appended to GAMES
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Destroza asteroides y sobrevive el mayor tiempo posible.",
  long: "…",            // Spanish copy, written at implementation
  cat: "SHOOTER",
  cover: "cover-asteroids",
  color: "cyan",
  best: 0,
  plays: "0",
}
```

```ts
// lib/games/asteroids/types.ts
export type AsteroidsStatus = 'playing' | 'dead' | 'gameover' | 'paused';

export interface AsteroidsState {
  score: number;
  lives: number;
  level: number;
  tripleShot: number; // seconds left, 0 = inactive
  status: AsteroidsStatus;
}

export interface AsteroidsCallbacks {
  onState: (s: AsteroidsState) => void; // fired when any field changes
  onGameOver: (finalScore: number) => void;
}

export interface AsteroidsEngine {
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void; // cancels rAF, removes key listeners
}

export function createAsteroids(
  canvas: HTMLCanvasElement,
  cb: AsteroidsCallbacks,
): AsteroidsEngine;
```

```ts
// lib/games/registry.ts
export interface GameCanvasProps {
  onState: (s: AsteroidsState) => void; // widened to a shared GameState when a 2nd game lands
  onGameOver: (finalScore: number) => void;
  paused: boolean;
  restartKey: number; // bump to restart
}
export const GAME_CANVASES: Record<
  string,
  React.ComponentType<GameCanvasProps>
>;
// { asteroids: AsteroidsCanvas }
```

```ts
// lib/games/asteroids/constants.ts — values ported verbatim from game.js
W = 800;
H = 600;
RADII = [0, 16, 30, 50];
SPEEDS = [0, 85, 55, 32];
POINTS = [0, 100, 50, 20];
POWERUP_DROP_CHANCE = 0.15;
POWERUP_DURATION = 5;
POWERUP_TTL = 12;
TRIPLE_SPREAD = 0.18;
```

Conventions:

- Coordinates: origin top-left, positions wrap toroidally. Velocities in px/s (not px/frame), as in `game.js`.
- Entities keep `update(dt)`, `draw(ctx)` and a `dead` flag. `ctx` is passed in, not a module global.
- `dt` is capped at 0.05 s.
- Input state (`keys`, `justPressed`) is per-engine instance, not module-level. Listeners are attached to `window` in `createAsteroids` and removed in `destroy()`.
- Score is saved with the existing `ScoreEntry` shape in `av_scores` (`{ game: "asteroids", score, name, at }`). No new localStorage keys.
- `status: "paused"` is set by the engine when `pause()` is called. The React `paused` prop is the source of truth.
- `best` and `plays` in the catalog entry are static placeholders.

## Implementation plan

1. Read the bundled Next.js 16 docs (`node_modules/next/dist/docs/01-app/`: Client Components / `"use client"`, `useEffect` cleanup patterns). Check how `app/salon/page.tsx` reads `av_scores` (filters by catalog id or not). No code changes.
2. Add the `asteroids` entry to `GAMES` in `lib/games.ts` and the `.cover-asteroids` rules in `app/globals.css`. Manual check: the card shows in `/biblioteca` (SHOOTER filter too), `/juegos/asteroids` renders, `/juegos/asteroids/jugar` shows the mock arena like every other game.
3. Add `lib/games/asteroids/constants.ts`, `types.ts` and `utils.ts` (`wrap`, `dist`, `rand`, `randInt`), ported from `game.js`. Not imported anywhere yet. Lint passes.
4. Add `lib/games/asteroids/entities/bullet.ts`, `asteroid.ts` and `particle.ts`. Each class has `update(dt)`, `draw(ctx)` and `dead`. `Asteroid.split()` included. Not imported anywhere yet.
5. Add `lib/games/asteroids/entities/ship.ts` and `powerup.ts`. `Ship.update(dt, input)` receives an input object (no globals). `tryShoot()` returns a `Bullet[]` (1 or 3 with the triple shot). Not imported anywhere yet.
6. Add `lib/games/asteroids/input.ts` (per-instance `keys` / `justPressed`, `pressed(code)`, `attach()` / `detach()`, `preventDefault` on Space and arrows) and `lib/games/asteroids/engine.ts` with `createAsteroids`: rAF loop, `dt` cap, black background, ship movement and drawing, `destroy()`. Manual check (temporary mount, not committed): the ship rotates, thrusts, wraps and shoots.
7. Extend `engine.ts`: asteroid spawning (4 on start, `3 + level` per level), bullet vs asteroid collisions, splitting, scoring by `POINTS`, particles, level advance. Manual check: asteroids split, score rises, a cleared field starts level 2.
8. Extend `engine.ts`: ship vs asteroid (`radius * 0.82` fudge), invincibility blink, lives, `dead` respawn timer, `gameover`, power-up drop rules (15% or guaranteed after 5 kills, one per level) and the 3x timer. Fire `onState` and `onGameOver`. Add `pause()`, `resume()`, `restart()`. Manual check: lives drop to 0 and `onGameOver(score)` fires once, restart resets state.
9. Add `components/games/AsteroidsCanvas.tsx` (client component: creates the engine in `useEffect`, destroys on unmount, reacts to `paused` and `restartKey`, CSS-scales the 800×600 canvas inside `.crt-screen`) and `lib/games/registry.ts` with `GAME_CANVASES = { asteroids: AsteroidsCanvas }`. Not wired into `PlayerScreen` yet.
10. Wire `PlayerScreen`: when `GAME_CANVASES[game.id]` exists, render it instead of the mock arena, and drive the HUD (score, lives, level, 3x timer) from `onState`. Other games keep the mock arena and their current HUD. Manual check: `/juegos/asteroids/jugar` is playable with a live HUD, `/juegos/rocas/jugar` still shows the mock.
11. Wire controls and game over: PAUSA/REANUDAR toggles `paused`, FIN pauses and opens the modal with the current score, `onGameOver` opens the modal, "GUARDAR PUNTUACIÓN" saves via `pushStoredScore({ game: "asteroids", score, name })`, "JUGAR DE NUEVO" bumps `restartKey` and closes the modal. Manual check: the full loop play → game over → save → replay, and the score appears in `av_scores`.
12. Add auto-pause on `window` blur / `document.hidden` in `AsteroidsCanvas`. Manual check: switching tab pauses, the game resumes only via REANUDAR.
13. Final pass: `npm run lint` and `npm run build`, console check on `/biblioteca`, `/juegos/asteroids`, `/juegos/asteroids/jugar`, `/salon`, spot-check scaling at 1280, 840 and 390 px widths, confirm the 7 other games still render the mock arena.

## Acceptance criteria

- [ ] `/biblioteca` shows an ASTEROIDS card, and it appears under the SHOOTER filter and in search for "asteroids".
- [ ] `rocas` is still in the catalog, unchanged, and `/juegos/rocas/jugar` still shows the mock arena.
- [ ] `/juegos/asteroids` renders the detail page with title, description and a button to `/juegos/asteroids/jugar`.
- [ ] `/juegos/asteroids/jugar` renders an 800×600 canvas inside the CRT frame, and the game starts on load with 4 large asteroids, 3 lives, level 1 and score 0.
- [ ] ArrowLeft / ArrowRight rotate the ship, ArrowUp thrusts, Space shoots (one bullet per press, 0.2 s cooldown).
- [ ] The ship and bullets wrap around all four canvas edges.
- [ ] Pressing Space or an arrow key while playing does not scroll the page.
- [ ] Shooting a large, medium or small asteroid adds exactly 20, 50 or 100 points. Large and medium split into 2 asteroids of the next smaller size, small ones don't split.
- [ ] Clearing all asteroids starts level `n + 1` with `3 + (n + 1)` large asteroids and resets the ship to the center.
- [ ] A ship-asteroid collision costs 1 life, and the ship respawns after 2 s with 3 s of blinking invincibility.
- [ ] A power-up drops at most once per level, appears after 5 kills at the latest, and picking it up enables a 3-bullet spread for 5 s.
- [ ] The HUD in `PlayerScreen` shows the live score (formatted `es-ES`), lives, level and, while active, the 3x seconds left.
- [ ] The canvas draws no HUD text and no "GAME OVER" overlay.
- [ ] At 0 lives the game-over modal opens with the final score.
- [ ] "GUARDAR PUNTUACIÓN" writes `{ game: "asteroids", score, name, at }` to `localStorage["av_scores"]`.
- [ ] "JUGAR DE NUEVO" closes the modal and starts a fresh game (score 0, lives 3, level 1).
- [ ] PAUSA freezes the game and REANUDAR resumes it. FIN pauses and opens the modal with the current score.
- [ ] Switching to another tab pauses the game, and it stays paused until REANUDAR.
- [ ] Leaving the page (SALIR or navigation) removes the key listeners and stops the loop (no console errors, no duplicated input after re-entering).
- [ ] The canvas scales down to fit the CRT container at 390 px width and keeps its 4:3 ratio.
- [ ] The 7 other games' player pages render exactly as before.
- [ ] No console errors on `/biblioteca`, `/juegos/asteroids`, `/juegos/asteroids/jugar` and `/salon`.
- [ ] `npm run lint` and `npm run build` pass with no errors.

## Decisions

- **Yes:** `asteroids` is a new catalog entry, separate from `rocas`. They are similar but different games, and each keeps its own id, cover and future implementation.
- **No:** replacing `rocas` with Asteroids. It would erase an existing catalog entry and mix two games.
- **Yes:** port to a TypeScript engine in `lib/games/asteroids/` plus a thin React canvas component. The platform HUD, pause and score saving need the game state, and an engine without React is easy to move or test later.
- **No:** embed the original `index.html` and `game.js` in an iframe from `public/`. State can't be shared cleanly with the HUD and modal, and it adds a second, unprocessed JS codebase.
- **Yes:** the engine draws only the playfield. Score, lives, level, 3x timer and game over live in the React HUD and modal. One source of truth, and the look matches the platform.
- **No:** keeping the canvas-drawn HUD and "GAME OVER" overlay. They would duplicate the platform's HUD and modal.
- **Yes:** a registry `lib/games/registry.ts` (`gameId → component`). `PlayerScreen` stays generic and each game spec only adds one entry.
- **No:** replacing the mock arena for all games. The other games are not built yet.
- **Yes:** per-instance input state and a `destroy()` that removes listeners. The reference uses module globals, which would leak listeners and duplicate input on remount in React.
- **Yes:** fixed 800×600 internal resolution, scaled with CSS. Keeps the gameplay numbers (speeds, radii) from `game.js` unchanged.
- **No:** a responsive internal resolution. It would change gameplay on different screens.
- **Yes:** save scores with the existing `pushStoredScore` (`av_scores` in localStorage). Supabase scores are a separate spec.
- **Yes:** auto-pause on tab blur. The reference only caps `dt`, but a React player with a pause button should not lose a life while the tab is hidden.
- **Yes:** `restartKey` prop to restart. Keeps `PlayerScreen` declarative, with no imperative ref.
- **Yes:** keyboard only (arrows and Space). Touch, sound and gamepad are separate specs.
- **Yes:** keep the 3x triple-shot power-up. It is in `game.js` even though the reference `CLAUDE.md` doesn't mention it.
- **Yes:** split the work into 13 small steps, with the engine built in three steps (loop and ship, asteroids and scoring, lives and game over). Each step stays commitable.

## Risks

| Risk                                                                                                              | Mitigation                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Strict Mode runs effects twice in dev, so two engines run and key listeners and rAF loops duplicate.        | `createAsteroids` returns `destroy()`, which cancels the rAF and detaches listeners. `AsteroidsCanvas` calls it in the `useEffect` cleanup. Check in dev that input is not doubled. |
| `onState` fires every frame and re-renders `PlayerScreen` 60 times per second.                                    | The engine emits only when a field changed (score, lives, level, status) and the 3x timer at 0.1 s steps. Check the React profiler or a render counter in step 10.                  |
| Browser autorepeat and focus: Space triggers page scroll or clicks a focused button (PAUSA, FIN).                 | `preventDefault` on Space and arrows while playing. Blur the clicked HUD buttons after the click so Space does not re-trigger them.                                                 |
| Hydration mismatch or SSR error: the engine touches `window` and `canvas`.                                        | `AsteroidsCanvas` is a client component and creates the engine only inside `useEffect`. Nothing from `lib/games/asteroids/` is called during render.                                |
| `Math.random()` and `performance.now()` use in draw makes the canvas differ between runs.                         | Only the engine uses them, client-side, after mount. They are not used in React render.                                                                                             |
| Pause logic conflicts: the engine's `paused` status, the `paused` prop, tab-blur auto-pause and FIN can disagree. | The React `paused` prop is the single source of truth. Blur and FIN set it, and the engine only follows `pause()` / `resume()`.                                                     |
| `/salon` may not list `asteroids` scores if it filters by a fixed game list.                                      | Step 1 reads `app/salon/page.tsx`. If it needs a change, it is added to the scope or split into its own spec before implementing.                                                   |
| High-DPI screens show a blurry canvas because of CSS scaling of an 800×600 bitmap.                                | Accepted for this spec, as a vector-style game at fixed resolution. A devicePixelRatio-aware canvas goes in a future spec if it looks bad.                                          |

## What is **not** in this spec

- Touch / mobile controls.
- Sound and music.
- UFOs, new enemies or new power-ups.
- Saving scores to Supabase, `/salon` changes.
- Real games for the other 7 catalog entries, including `rocas`.
- Real `best` / `plays` stats.
- Gamepad support.
- Automated tests.

Each one of those, if it lands, goes in its own spec.

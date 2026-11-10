# SPEC 06 — Games table and per-game leaderboard

> **Status:** Implemented
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-11-10
> **Objective:** Create Supabase `games` and `scores` tables, save scores from the player screen to Supabase, and show a real per-game top-10 leaderboard on `/salon`.

## Scope

**In:**

- Supabase migration creating `games` and `scores` tables, with RLS enabled on both.
- `games` seeded with the 9 catalog entries from `lib/games.ts` (id, title, cat). Static `GAMES` stays as the UI source for covers, copy and colors.
- `scores` columns: `game_id` (FK to `games.id`), `player_name`, `score`, nullable `user_id` (for the future auth spec), `created_at`.
- RLS: public `select` on both tables, public `insert` on `scores`, no `update` / `delete` for anyone.
- Score sanity constraints at DB level: `score >= 0`, `player_name` non-empty and max length.
- `lib/scores.ts` data layer: `submitScore()` (insert) and `getTopScores(gameId, limit)` using the Supabase clients from SPEC 04.
- "GUARDAR PUNTUACIÓN" in `PlayerScreen` writes to Supabase via `submitScore()` instead of `pushStoredScore`. On failure, it falls back to localStorage `av_scores` and shows an error message.
- `/salon` shows the real top 10 for the selected game (tabs per game, podium + table), replacing `seededScores()`. Includes loading, empty and error states.
- `npm run lint` and `npm run build` pass.

**Out of scope (for future specs):**

- Auth, `profiles`, linking scores to real users (`user_id` stays null).
- Global leaderboard across games and time filters (weekly / monthly).
- Server-side score validation, rate limiting, anti-cheat (`app/api/scores`).
- Migrating existing `av_scores` localStorage data.
- Replacing the static `GAMES` array with a DB read, or driving `best` / `plays` from real data.
- Showing "your rank" / personal best on `/salon`.
- Realtime updates of the leaderboard.
- Generated types (`database.types.ts`).
- Automated tests.

## Data model

```sql
-- migration: create_games_and_scores
create table public.games (
  id    text primary key,                       -- matches GAMES[].id in lib/games.ts
  title text not null,
  cat   text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS'))
);

create table public.scores (
  id          bigint generated always as identity primary key,
  game_id     text not null references public.games(id),
  player_name text not null check (char_length(trim(player_name)) between 1 and 16),
  score       integer not null check (score >= 0),
  user_id     uuid references auth.users(id),   -- null until the auth spec
  created_at  timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);

alter table public.games  enable row level security;
alter table public.scores enable row level security;

create policy "games are public"  on public.games  for select using (true);
create policy "scores are public" on public.scores for select using (true);
create policy "anyone can submit" on public.scores for insert with check (true);
-- no update / delete policies → denied
```

```ts
// lib/scores.ts
export interface ScoreRow {
  id: number;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string; // ISO
}

export async function submitScore(input: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function getTopScores(
  gameId: string,
  limit?: number, // default 10
): Promise<ScoreRow[]>; // ordered score desc, created_at asc (earlier wins ties); throws on error
```

Conventions:

- `games.id` equals the catalog id (`asteroids`, `rocas`, ...). Seed rows are inserted in the same migration.
- `lib/scores.ts` uses the browser client (`lib/supabase/client.ts`), since both callers (`PlayerScreen`, `/salon`) are client components.
- `submitScore` trims `player_name` and never throws; it returns `{ ok: false, error }` so the caller can fall back to localStorage.
- The `insert` response is not read back (no `select` needed after insert).
- Leaderboard ties: earlier `created_at` ranks higher.
- Dates are shown in `/salon` formatted `es-ES`.
- Clients stay untyped (no `Database` generic), so `ScoreRow` is hand-written.
- Adding a game to `GAMES` requires a new migration inserting it into `games`.

## Implementation plan

1. Read the bundled Next.js 16 docs (`node_modules/next/dist/docs/01-app/`: Client Components, data fetching in client components) and Supabase RLS docs (via MCP `search_docs`). Check `PlayerScreen`'s name input (max length), `pushStoredScore` and how `/salon` uses `useUser`. No code changes.
2. Apply the migration `create_games_and_scores` via MCP `apply_migration`: both tables, index, RLS, policies, and seed of the 9 games. Verify with `list_tables`, `execute_sql` (9 rows in `games`) and `get_advisors` (security: no RLS warnings).
3. Add `lib/scores.ts` with `submitScore()` and `getTopScores()` using the browser client. Not imported anywhere yet. Lint passes. Manual check: call both from a temporary client snippet (not committed): insert a row, read it back, then delete the test row via `execute_sql`.
4. Rewrite `/salon` to read from `getTopScores(tab)`: fetch on tab change, loading state, empty state ("SÉ EL PRIMERO EN ENTRAR"), error state with retry. Podium and table render real rows (podium handles fewer than 3 rows). Remove `seededScores()` usage and the fake "your rank" block. Manual check: with an empty table, each tab shows the empty state.
5. Wire `PlayerScreen` "GUARDAR PUNTUACIÓN" to `submitScore()`. On success, close the modal and keep the current post-save behavior. On failure, call `pushStoredScore` as a fallback and show an error message. Disable the button while the request is in flight. Manual check: play Asteroids, save, see the row in `/salon` and in `execute_sql`.
6. Cleanup: remove `seededScores` from `lib/games.ts` if nothing else uses it. Final pass: `npm run lint` and `npm run build`, console check on `/salon`, `/biblioteca`, `/juegos/asteroids/jugar`. Delete any test rows from `scores`.

## Acceptance criteria

- [x] `list_tables` shows `games` and `scores` in `public`, both with RLS enabled.
- [x] `games` contains exactly the 9 catalog ids (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`, `ranaria`, `duelo-pixel`, `asteroids`).
- [x] `get_advisors` (security) reports no RLS-disabled or missing-policy warning for `games` / `scores`.
- [x] With the publishable key, `select` on `games` and `scores` succeeds, `insert` on `scores` succeeds, and `update` / `delete` on `scores` affect 0 rows or are rejected.
- [x] Inserting a score with `score < 0`, an empty `player_name`, a name longer than 16 chars, or an unknown `game_id` is rejected by the DB.
- [x] `/salon` shows no fake data: `seededScores` is no longer used and the fake "your rank" block is gone.
- [x] `/salon` with no scores for a game shows the empty state text for that tab.
- [x] `/salon` shows scores for the selected game only, ordered by score descending, max 10 rows.
- [x] Two scores with the same value are ordered by earlier `created_at` first.
- [x] The podium renders correctly with 0, 1, 2 and 3+ rows (no crash, no `undefined` text).
- [x] If the Supabase request fails (e.g. offline), `/salon` shows an error state with a retry button, and retry reloads the data.
- [x] Saving a score from `/juegos/asteroids/jugar` inserts one row in `scores` with the right `game_id`, `player_name`, `score` and `user_id` null.
- [x] The saved Asteroids score appears in `/salon` under ASTEROIDS after saving, without manual DB edits.
- [x] Saving a score from another game (e.g. `rocas`) inserts a row with that game's `game_id`.
- [x] The "GUARDAR PUNTUACIÓN" button is disabled while the request is in flight (no duplicate rows on double click).
- [x] When `submitScore()` fails, the score is written to `localStorage["av_scores"]` and an error message is shown.
- [x] Scores are shown with `es-ES` number format and `es-ES` date format.
- [x] No test rows remain in `scores` after verification.
- [x] No console errors on `/salon`, `/biblioteca`, `/juegos/asteroids` and `/juegos/asteroids/jugar`.
- [x] `npm run lint` and `npm run build` pass with no errors.

## Decisions

- **Yes:** a Supabase `games` table, seeded with the 9 catalog entries. `scores.game_id` needs an FK target, and it prepares a future DB-driven catalog.
- **No:** a UI table of games on a page. Not requested beyond the DB table, and `/biblioteca` already lists games.
- **No:** replacing the static `GAMES` array with a DB read now. Covers, copy and colors live in code, and moving them is its own spec.
- **Yes:** `games.id` is `text` and equals the catalog id. No mapping layer between code ids and DB ids.
- **Yes:** anonymous scores with `player_name` text and a nullable `user_id`. No real auth exists yet, and the column avoids a later migration.
- **No:** requiring auth before saving scores. Auth is a separate spec, and it would block this one.
- **Yes:** per-game top 10, all-time only. Matches the current `/salon` tabs.
- **No:** global leaderboard and time filters. They need extra queries and UI, so they go in a later spec.
- **Yes:** `submitScore()` writes to Supabase, and localStorage `av_scores` is only an error fallback.
- **No:** dual-writing always, or syncing localStorage later. It adds complexity for fake dev data.
- **Yes:** accept forgeable client scores for now. RLS allows insert and select only, plus DB `check` constraints on score and name.
- **No:** `app/api/scores` with server validation. Without auth or a game-side signal, it would only add a sanity check that the client can still bypass.
- **Yes:** ignore existing `av_scores` data. It is dev data from SPEC 05 testing.
- **Yes:** browser client in `lib/scores.ts`. Both callers are client components, so there is no need for a server action or route.
- **No:** realtime subscriptions. Fetch on tab change is enough.
- **Yes:** tie-break by earlier `created_at`. Rewards whoever reached the score first, and the order stays stable.
- **Yes:** remove the fake "your rank" block from `/salon`. It depended on seeded data and a fake user, and a real version needs auth.
- **Yes:** composite index `(game_id, score desc, created_at)`. It matches the leaderboard query exactly.
- **Yes:** one spec instead of splitting. Schema, submission and UI are small and only useful together.

## Risks

| Risk                                                                                                       | Mitigation                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anyone can insert arbitrary scores (fake high scores, spam, offensive names) with the publishable key.     | Accepted for this spec. DB `check` constraints limit name length and negative scores. A later spec adds auth, server validation and rate limiting. |
| Insert policy `with check (true)` is flagged by Supabase advisors as permissive.                           | Intentional, documented here. Step 2 reviews `get_advisors` and records any warning as expected.                                                   |
| Catalog ids in `lib/games.ts` and `games` rows drift apart; saving a score for a new game fails on the FK. | Seed lives in the migration. Adding a game to `GAMES` requires a new migration inserting into `games`. Noted in the Data model conventions.        |
| Supabase is down or the user is offline when saving, so the score is lost.                                 | Fallback to `localStorage["av_scores"]` plus an error message. Fallback entries are not synced back (out of scope).                                |
| Double click on "GUARDAR PUNTUACIÓN" inserts duplicate rows.                                               | Button disabled while the request is in flight. Acceptance criterion checks it.                                                                    |
| Fast tab switching on `/salon` shows stale results (an older request resolves after a newer one).          | Ignore results whose tab no longer matches the selected one (cancel flag in the `useEffect` cleanup).                                              |
| Stale `.env.local` values or missing env vars make `createClient()` throw on the client.                   | `/salon` catches the error and shows the error state. `submitScore` catches it and returns `{ ok: false }`.                                        |
| Test rows left in `scores` pollute the real leaderboard.                                                   | Step 3 and step 6 delete them via `execute_sql`. Acceptance criterion checks it.                                                                   |

## What is **not** in this spec

- Auth, `profiles`, linking scores to real users.
- Global leaderboard and time filters.
- Server-side score validation, rate limiting, anti-cheat.
- Migrating existing `av_scores` localStorage data.
- Replacing the static `GAMES` array with a DB read, real `best` / `plays` stats.
- "Your rank" / personal best on `/salon`.
- Realtime leaderboard updates.
- Generated types.
- Automated tests.

Each one of those, if it lands, goes in its own spec.

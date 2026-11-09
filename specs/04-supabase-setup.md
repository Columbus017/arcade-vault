# SPEC 04 — Supabase installation and configuration

> **Status:** Implemented
> **Depends on:** None (follows the `.env.example` convention from SPEC 03)
> **Date:** 2026-11-09
> **Objective:** Install `@supabase/supabase-js` and `@supabase/ssr`, configure env vars, and add browser and server client factories, verified by a temporary connection check.

## Scope

**In:**

- Dependencies: `@supabase/supabase-js`, `@supabase/ssr`.
- Env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`:
  - Real values in `.env.local` (gitignored), fetched via Supabase MCP (`get_project_url`, `get_publishable_keys`).
  - Empty entries in committed `.env.example`, under the existing `#SUPABASE` block.
- `lib/supabase/client.ts`: browser client factory (`createBrowserClient`).
- `lib/supabase/server.ts`: server client factory (`createServerClient`, cookies via `next/headers`).
- Read the bundled Next.js 16 docs (`cookies()` is async) and Supabase SSR docs before writing code.
- Temporary connection check (not committed): server-side call using the server client to confirm URL + key are valid.
- `npm run build` and `npm run lint` pass.

**Out of scope (for future specs):**

- Auth: sign up, login, logout, `/auth` page rewrite, replacing `UserProvider` / `lib/auth.ts` fake login.
- `proxy.ts` session refresh.
- Tables, migrations, RLS policies, `profiles`, scores, leaderboard (`/salon`).
- Generated types (`database.types.ts`) and typing the clients.
- Migrating `localStorage` data (`av_user`, `av_scores`).
- Supabase CLI / local stack (`supabase/` directory).
- Service-role key or any server-only secret usage.
- Automated tests.

## Data model

This feature introduces no database tables or domain data structures. It only adds client factories and env vars.

```ts
// lib/supabase/client.ts
export function createClient(): SupabaseClient; // browser, createBrowserClient

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient>; // server, createServerClient + await cookies()
```

```bash
# .env.example (values empty) / .env.local (real values)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Conventions:

- Both factories read only the two `NEXT_PUBLIC_*` vars. No other keys.
- Server `createClient()` is async because `cookies()` is async in Next.js 16.
- The server client's cookie `setAll` is wrapped in `try/catch` (Server Components can't set cookies; harmless until `proxy.ts` exists).
- Missing env var → throw a clear error (`NEXT_PUBLIC_SUPABASE_URL missing`), no silent fallback.
- Clients are untyped (no `Database` generic) until the types spec.

## Implementation plan

1. Read the bundled Next.js 16 docs (`node_modules/next/dist/docs/01-app/`: `cookies`, environment variables) and the Supabase SSR docs for Next.js (via MCP `search_docs`) before writing code. No code changes.
2. Install `@supabase/supabase-js` and `@supabase/ssr`. Add empty `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.example` under `#SUPABASE`. App still builds.
3. Fetch the project URL and publishable key via MCP (`get_project_url`, `get_publishable_keys`) and add them to `.env.local`. Restart the dev server to pick them up.
4. Add `lib/supabase/client.ts` (`createClient()` with `createBrowserClient`, throws if an env var is missing). Not imported anywhere yet.
5. Add `lib/supabase/server.ts` (async `createClient()` with `createServerClient`, `await cookies()`, `setAll` in `try/catch`, throws if an env var is missing). Not imported anywhere yet.
6. Run the temporary connection check: a throwaway server-side call using `lib/supabase/server.ts` (e.g. `auth.getSession()` plus a REST ping), run from a temp route or script, then delete it. Confirm no error and a valid response.
7. Run `npm run lint`, `npm run build`, and `npm run format`. Commit.

## Acceptance criteria

- [x] `package.json` lists `@supabase/supabase-js` and `@supabase/ssr` in `dependencies`.
- [x] `.env.example` contains `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` with empty values.
- [x] `.env.local` contains both vars with real values and is gitignored (`git status` does not list it).
- [x] `lib/supabase/client.ts` and `lib/supabase/server.ts` exist, each exporting `createClient`.
- [x] Both factories throw a clear error when an env var is missing (verified by temporarily unsetting one).
- [x] The temporary connection check using the server client returns a response from Supabase with no auth/URL/key error.
- [x] The temporary check file/route is deleted and absent from the final diff.
- [x] No Supabase key other than the publishable key appears in the repo or client bundle (no service-role key, no DB password in `NEXT_PUBLIC_*`).
- [x] `proxy.ts`, `supabase/` directory, and `database.types.ts` do not exist.
- [x] Existing routes (`/`, `/biblioteca`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/auth`, `/about`) render unchanged, with no console errors.
- [x] `npm run build` and `npm run lint` pass with no errors.

## Decisions

- **Yes:** install both `@supabase/supabase-js` and `@supabase/ssr`. The SSR package gives cookie-based clients for the App Router, which the future auth spec needs.
- **No:** `supabase-js` only. A later swap to `@supabase/ssr` would rewrite the client setup.
- **Yes:** two factories, `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server). Matches the Supabase SSR pattern and keeps server and client code separate.
- **Yes:** publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), not the legacy anon key. It is the current key type, and the MCP exposes it.
- **Yes:** factories throw on missing env vars. A misconfiguration fails loudly instead of producing confusing auth errors later.
- **Yes:** values fetched via Supabase MCP into `.env.local`. No manual copy-paste from the dashboard.
- **Yes:** temporary connection check, not committed. Verifies the setup without leaving dead code. No test runner exists.
- **No:** `proxy.ts` now. Without auth there is no session to refresh, and it adds a global request hook. Goes in the auth spec.
- **No:** generated types now. No tables exist, so the types would be empty. Goes in the schema spec.
- **No:** Supabase CLI / `supabase/` directory. Migrations and local stack are not needed for installation.
- **No:** migrating `localStorage` data. It is fake data and no auth/scores exist yet.
- **Yes:** split Supabase work into several specs (install, auth, schema, scores). The original request touched three or more areas.

## Risks

| Risk                                                                                                                                  | Mitigation                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `@supabase/ssr` / `cookies()` API differs in Next.js 16 from prior knowledge (async `cookies()`, newer `getAll`/`setAll` pattern).    | Step 1 reads the bundled Next.js docs and Supabase SSR docs via MCP before code.                                                           |
| `NEXT_PUBLIC_*` vars are inlined at build time; a stale dev server ignores new `.env.local` values.                                   | Step 3 restarts the dev server before the connection check.                                                                                |
| `.env.local` accidentally committed with the project URL/key.                                                                         | Acceptance criterion checks `git status`. The publishable key is public by design, but the file also holds the DB password and Resend key. |
| Server client `setAll` throws when called from a Server Component.                                                                    | Wrapped in `try/catch`. `proxy.ts` (future auth spec) will handle cookie refresh.                                                          |
| Connection check leaves a temp route or script in the repo.                                                                           | Step 6 deletes it. Acceptance criterion checks the final diff.                                                                             |
| Publishable key without RLS-protected tables exposes nothing today, but future tables created without RLS would be publicly readable. | Out of scope here. The schema spec must enable RLS on every table.                                                                         |

## What is **not** in this spec

- Auth (sign up, login, logout, `/auth` rewrite, replacing fake login).
- `proxy.ts` session refresh.
- Tables, migrations, RLS, `profiles`, scores, leaderboard.
- Generated types.
- `localStorage` data migration.
- Supabase CLI / local stack.
- Service-role key usage.
- Automated tests.

Each one of those, if it lands, goes in its own spec.

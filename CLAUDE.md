# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing games online and competing for high scores (see README.md, in Spanish).

The repo is currently just the `create-next-app` scaffold (App Router, TypeScript, Tailwind v4, ESLint flat config) — no game features, routes, or data layer exist yet beyond the default `app/layout.tsx` / `app/page.tsx`.

### Spec Driven Design

This project follows a spec-driven workflow using the `spec` and `spec-impl` skills (installed globally, see `~/.claude/skills/spec` and `~/.claude/skills/spec-impl`, sourced from https://github.com/Klerith/fernando-skills). Use `/spec` to draft a feature spec and `/spec-impl` to implement against an approved spec, rather than jumping straight to code for non-trivial features.

## Commands

```bash
npm run dev     # start dev server (Turbopack)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint
```

There is no test runner configured yet.

## Critical: this is Next.js 16, not the Next.js in your training data

Per `AGENTS.md`, **before writing any Next.js code, read the relevant doc under `node_modules/next/dist/docs/`** — it's version-matched to the installed `next@16.2.11` and is the source of truth over prior knowledge. Docs are organized under `01-app/01-getting-started/`, `01-app/02-guides/`, and `01-app/03-api-reference/` (App Router is what this project uses; ignore `02-pages/`).

Known breaking/renamed APIs relative to older Next.js versions — verify against the bundled docs before using:

- **Middleware → Proxy**: `middleware.ts` is now `proxy.ts` (export `proxy()` instead of `middleware()`). See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- **Cache Components**: the current caching model is opt-in via `cacheComponents: true` in `next.config.ts` (not yet enabled in this project). When enabled, `"use cache"` + `cacheLife()` / `cacheTag()` / `updateTag()` from `next/cache` replace the old `fetch` `revalidate`/`tags` options, and Partial Prerendering (PPR) becomes the default rendering mode. Runtime APIs (`cookies()`, `headers()`, `searchParams`, non-deterministic calls) must be reached via `connection()` or wrapped in `<Suspense>`, or the build fails with "Uncached data was accessed outside of `<Suspense>`". See `08-caching.md` and `02-guides/caching-without-cache-components.md` (the previous/default model, relevant since `cacheComponents` isn't enabled here yet).
- Check `01-app/01-getting-started/18-upgrading.md` for the full list of changes before assuming any App Router API works the way it used to.

## Architecture notes

- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Styling is Tailwind v4 via `@tailwindcss/postcss` (`postcss.config.mjs`), configured in `app/globals.css` rather than a `tailwind.config.js`.
- ESLint uses the flat config format (`eslint.config.mjs`), composing `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.

# SPEC 03 — About Page + Contact Email

> **Status:** Implemented
> **Depends on:** SPEC 02 (Nav, `hooks/useReveal.ts`, home CSS base)
> **Date:** 2026-11-03
> **Objective:** Implement the About + Contact page at `/about` from `references/templates/home-about/about.jsx`, with the contact form sending a real email to the team inbox via Resend through a Server Action.

## Scope

**In:**

- About page at `/about` (`app/about/page.tsx`), ported verbatim from `references/templates/home-about/about.jsx`: hero (kicker, title, mission, 3 highlights with pixel icons), animated pixel divider, contact section (intro, 3 tips, form).
- Only the About rules from `references/templates/home-about/styles.css` merged into `app/globals.css` (`.about*`, `.highlight*`, `.contact-*`, `.terminal-success`, `.term-*`, `@keyframes shake` and related). Existing rules untouched.
- Scroll-reveal on `.reveal` sections, reusing `hooks/useReveal.ts`.
- `components/Nav.tsx`: "Acerca de" → `/about` on desktop and mobile panel (before the auth entry), active on `/about`.
- Contact form (`components/about/ContactForm.tsx`, client) wired to a Server Action `sendContactMessage` (`app/about/actions.ts`) via `useActionState`.
- Email sent with the `resend` SDK to `CONTACT_TO_EMAIL`, from `CONTACT_FROM_EMAIL` (default `onboarding@resend.dev`), `replyTo` = user's email. Subject `[Arcade Vault] Nuevo mensaje de {name}`, plain text + minimal HTML string.
- Validation in `lib/contact.ts` (`validateContact()`), shared client + server: all fields required, email regex, max lengths (name 80, email 254, msg 2000). HTML-escaped user input in the email body.
- UI states:
  - **Idle:** form as in template.
  - **Client invalid:** shake, no request (as in template).
  - **Pending:** button disabled, `▶  TRANSMITIENDO…`.
  - **Success:** terminal screen from template with the user's name; "ENVIAR OTRO MENSAJE" resets the form.
  - **Error** (server validation, Resend failure, missing env): form stays filled, shake, red pixel line `✖ ERROR DE TRANSMISIÓN. INTÉNTALO DE NUEVO.` above the button.
- Honeypot hidden field; if filled → returns success without sending.
- Missing `RESEND_API_KEY` → error state + `console.error("RESEND_API_KEY missing")` on the server.
- Env: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` in `.env.local` (gitignored) + committed `.env.example`.
- New dependency: `resend`.

**Out of scope (for future specs):**

- Auto-reply/confirmation email to the user.
- Verified custom sending domain (config-only change later via `CONTACT_FROM_EMAIL`).
- Rate limiting, CAPTCHA, or any spam protection beyond the honeypot.
- Storing messages (DB, log, admin inbox).
- React Email templates (`@react-email`).
- `zod` or any validation library.
- Automated tests.

## Data model

```ts
// lib/contact.ts
export const CONTACT_LIMITS = { name: 80, email: 254, msg: 2000 } as const;

export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactField = keyof ContactInput;

export type ContactResult =
  | { status: "idle" }
  | { status: "success"; name: string }   // trimmed name, shown in terminal screen
  | { status: "error" };                  // single generic message in UI

// Trims all fields; returns null if valid, or the first invalid field.
export function validateContact(input: ContactInput): ContactField | null;

export function escapeHtml(s: string): string;
```

```ts
// app/about/actions.ts
"use server";
export async function sendContactMessage(
  prev: ContactResult,
  formData: FormData,          // fields: name, email, msg, website (honeypot)
): Promise<ContactResult>;
```

```ts
// lib/about.ts
export interface Highlight {
  icon: "HEART" | "BROWSER" | "PLANT";
  text: string;
  color: "magenta" | "cyan" | "green";   // NeonColor subset from lib/home.ts
}
export const HIGHLIGHTS: Highlight[];    // 3 items, verbatim from about.jsx
```

```bash
# .env.example
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

Conventions:

- All copy ported verbatim from `about.jsx`, in Spanish (including `❤️`).
- Honeypot field name: `website`, visually hidden, `tabIndex={-1}`, `autoComplete="off"`.
- UI error is generic — no per-field messages (template has none). Server logs the real cause.
- No `localStorage` keys added.
- Pixel icons are SVG components (`components/about/HighlightIcon.tsx`), not data.

## Implementation plan

1. Read the bundled Next.js 16 docs for Server Actions and forms (`node_modules/next/dist/docs/01-app/.../forms`, `updating-data`, `use-server`) before writing code. No code changes.
2. Add `lib/about.ts` (`Highlight`, `HIGHLIGHTS`) and `lib/contact.ts` (types, `CONTACT_LIMITS`, `validateContact()`, `escapeHtml()`). No UI changes.
3. Merge the About-only rules from `references/templates/home-about/styles.css` into `app/globals.css` (`.about*`, `.highlight*`, `.about-divider`/`.div-*`, `.contact-*`, `@keyframes shake`, `.terminal-success`, `.term-*`, `.dot`, `.caret` and related). Diff selectors first; add only missing ones. Add a `.contact-error` rule for the error line. Manual check: existing routes render as before.
4. Add `components/about/HighlightIcon.tsx` and `app/about/page.tsx` with the hero, highlights and divider (static, `useReveal` via a small client wrapper if needed). Add "Acerca de" → `/about` to `components/Nav.tsx` (desktop + mobile, before auth entry, active on `/about`). Manual check: `/about` renders the hero; Nav link works and is active.
5. Add `components/about/ContactForm.tsx` (client) with the contact intro + form, client validation + shake, honeypot, and a **local-only** success (no server yet). Render in `app/about/page.tsx`. Manual check: empty submit shakes; valid submit shows terminal screen; "ENVIAR OTRO MENSAJE" resets.
6. `npm install resend`. Add `.env.example`, confirm `.env.local` is gitignored. Add `app/about/actions.ts` with `sendContactMessage`: honeypot check → `validateContact` → env check → `resend.emails.send({ from, to, replyTo, subject, text, html })` → `ContactResult`. Manual check: none yet (not wired).
7. Wire `ContactForm` to `sendContactMessage` via `useActionState`: pending label `▶  TRANSMITIENDO…` + disabled button, success → terminal screen, error → shake + `✖ ERROR DE TRANSMISIÓN. INTÉNTALO DE NUEVO.` with fields kept. Manual check: with real env, email arrives in `CONTACT_TO_EMAIL` with correct subject and reply-to; without `RESEND_API_KEY`, error state + server log.
8. Final pass: console clean on `/about` and existing routes, responsive check (820px / 900px breakpoints), honeypot test, `npm run build` + `npm run lint` pass.

## Acceptance criteria

- [x] `/about` renders, in order: hero (kicker "▸ ACERCA DE", title "ACERCA DE ARCADE VAULT", mission paragraph), 3 highlights, pixel divider, contact section.
- [x] Highlights render 3 cards with HEART/magenta, BROWSER/cyan, PLANT/green pixel icons and the template copy verbatim.
- [x] The divider renders 24 animated pixels.
- [x] Sections with `.reveal` gain `.in` when scrolled into view.
- [x] Contact intro shows "CONTÁCTANOS", the subtitle and 3 tips (RESPUESTA EN 24-48H, SUGERENCIAS BIENVENIDAS, SIN SPAM, JAMÁS).
- [x] Form shows NOMBRE, CORREO ELECTRÓNICO, MENSAJE with template placeholders and the "▶  ENVIAR MENSAJE" button.
- [x] Submitting with any empty field shakes the form and sends no request.
- [x] While pending, the button is disabled and reads "▶  TRANSMITIENDO…".
- [ ] Valid submit with correct env delivers one email to `CONTACT_TO_EMAIL` with subject `[Arcade Vault] Nuevo mensaje de {name}`, `replyTo` = submitted email, body containing name, email and message.
- [ ] HTML in the message (e.g. `<b>x</b>`) appears escaped in the email, not rendered.
- [x] On success, the terminal screen shows `GRACIAS, {NAME}.` (uppercased); "ENVIAR OTRO MENSAJE" returns an empty form.
- [x] Without `RESEND_API_KEY`, submit shows the error line `✖ ERROR DE TRANSMISIÓN. INTÉNTALO DE NUEVO.`, form shakes, fields stay filled, server logs `RESEND_API_KEY missing`.
- [x] Server rejects invalid email format or over-limit fields (name >80, email >254, msg >2000) with the error state and no email sent.
- [x] Filling the honeypot `website` field returns the success screen and sends no email.
- [x] `RESEND_API_KEY` never appears in client bundles (action file is `"use server"`, no `NEXT_PUBLIC_` prefix).
- [x] `.env.example` is committed with the 3 vars; `.env.local` is gitignored.
- [x] Nav shows "Acerca de" on desktop and mobile panel, linking to `/about`, active only on `/about`.
- [x] Below 900px the contact grid stacks; below 820px highlights stack to 1 column.
- [x] Existing routes (`/`, `/biblioteca`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/auth`) render unchanged after the CSS merge.
- [x] No console errors on `/about`.
- [ ] `npm run build` and `npm run lint` pass with no errors.

## Decisions

- **Yes:** route `/about`. User choice.
- **Yes:** Server Action + `useActionState`. No public API endpoint, built-in pending state, API key stays server-only.
- **No:** Route Handler `app/api/contact/route.ts`. Only useful if external clients call it; none do.
- **Yes:** email to team inbox only, `replyTo` = user's email. Replying from the inbox answers the user directly.
- **No:** auto-reply to the user. Needs a verified domain, doubles Resend quota usage, and turns the form into a vector to email arbitrary addresses.
- **Yes:** `CONTACT_FROM_EMAIL` default `onboarding@resend.dev`. No verified domain yet; switching later is config-only.
- **Yes:** env vars `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` in `.env.local` + committed `.env.example`.
- **Yes:** generic single error line, form kept filled. Template has no error state; per-field errors would add UI not in the design.
- **Yes:** hand-rolled `validateContact()` shared client + server. Three fields don't justify `zod`.
- **Yes:** honeypot returning fake success. Cheap, invisible, doesn't tip off bots.
- **No:** rate limiting / CAPTCHA. Needs storage or third-party service; deferred.
- **Yes:** plain text + minimal HTML string with escaped input. No `@react-email` dependency for one simple email.
- **Yes:** missing API key → error state + server log, no fake success. Avoids silently losing messages.
- **Yes:** `HIGHLIGHTS` in `lib/about.ts`. Mirrors SPEC 02's `lib/home.ts` convention.
- **Yes:** merge only About rules into `app/globals.css`. Same approach as SPEC 02; protects existing screens.
- **Yes:** local-only success in step 5 before wiring Resend. Keeps each step functional and committable.

## Risks

| Risk | Mitigation |
| --- | --- |
| `onboarding@resend.dev` only delivers to the Resend account email; any other `CONTACT_TO_EMAIL` fails with an API error. | `.env.example` comment documents it. Error path logs the Resend error message server-side. |
| Merged About CSS collides with existing selectors (`.field`, `.reveal`, `.btn`, `.kicker` already exist) and alters other screens. | Diff selectors before merging; add only missing ones; scope new rules under `.contact-form` / `.about` where they'd collide. |
| `.contact-form textarea` styling depends on `.field input` rules; textarea may look unstyled. | Port the template's `.contact-form textarea` rules explicitly; visual check in step 5. |
| `useActionState` / Server Action API differs in Next 16 / React 19 from prior knowledge. | Step 1 reads bundled docs before code. |
| Resend SDK `send()` returns `{ data, error }` instead of throwing; unchecked `error` shows false success. | Action checks `error` explicitly and wraps the call in `try/catch`. |
| Header injection / HTML injection via name in subject or body. | Trim + length-limit name; strip `\r\n` from subject; `escapeHtml()` on all HTML body values. |
| Abuse/spam floods consume Resend free quota (100/day). | Honeypot now; rate limiting deferred to own spec. |
| `.reveal` contact section stays hidden if observer doesn't fire. | Reuse SPEC 02's `useReveal`, which already handles elements in view on load. |

## What is **not** in this spec

- Auto-reply/confirmation email to the user.
- Verified custom sending domain.
- Rate limiting, CAPTCHA, or spam protection beyond the honeypot.
- Storing messages (DB, log, admin inbox).
- React Email templates.
- `zod` or any validation library.
- Automated tests.

Each one of those, if it lands, goes in its own spec.

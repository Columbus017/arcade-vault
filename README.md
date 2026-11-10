## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind v4
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`): juegos y puntuaciones
- Resend: envío de mensajes del formulario de contacto

## Requisitos

- Node.js 20+
- Proyecto de [Supabase](https://supabase.com) con las tablas `games` y `scores` (migración en `specs/06-games-and-leaderboard.md`, RLS activado)
- Cuenta de [Resend](https://resend.com) (API key)

## Configuración

```bash
npm install
cp .env.example .env.local   # completar variables
npm run dev
```

### Variables de entorno (`.env.local`)

| Variable                               | Descripción                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto Supabase                                                                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key de Supabase (pública)                                                                        |
| `SUPABASE_DB_PASSWORD`                 | Password de la base de datos (solo servidor)                                                                 |
| `RESEND_API_KEY`                       | API key de Resend (solo servidor, nunca `NEXT_PUBLIC_`)                                                      |
| `CONTACT_TO_EMAIL`                     | Bandeja que recibe los mensajes de contacto                                                                  |
| `CONTACT_FROM_EMAIL`                   | Remitente (por defecto `onboarding@resend.dev`; con este remitente Resend solo entrega al email de tu cuenta) |

## Rutas

| Ruta                   | Descripción                                 |
| ---------------------- | ------------------------------------------- |
| `/`                    | Home                                        |
| `/biblioteca`          | Catálogo de juegos                          |
| `/juegos/[id]`         | Detalle del juego                           |
| `/juegos/[id]/jugar`   | Pantalla de juego (Asteroids disponible)    |
| `/salon`               | Salón de la fama: top 10 por juego          |
| `/about`               | Acerca de + formulario de contacto (Resend) |
| `/auth`                | Pantalla de autenticación                   |

## Puntuaciones

Al guardar, la puntuación se inserta en Supabase (`scores`). Si falla, se guarda en `localStorage` (`av_scores`) como respaldo.

## Usa Spec Driven Design

Basado en /spec y /spec-impl. Las specs viven en `specs/` (una rama por spec: `spec-0X-nombre`).

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

```bash
npm run dev     # start dev server (Turbopack)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint
npm run format  # prettier --write .
```

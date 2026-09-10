# Parent Reset

A practical web app for overwhelmed parents. Open it, answer six short
questions, and get a small list for today, what can wait until this week, and
what you can let go.

Not therapy. Not medical. Not a family-management platform. Just a calmer day.

## Status: Milestone 1

Done in this milestone:

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- Design system (warm, calm, mobile-first)
- Landing page with mobile navigation
- Parent Reset flow (six questions, one-handed on a phone)
- Deterministic `ResetPlanner` behind a service interface
- Result page (Today / This week / Let it go)
- On-device persistence for guests (localStorage), with a Supabase repository
  ready for accounts
- Full i18n infrastructure with 26 locales (all EU official languages plus
  English, Chinese and Japanese), locale-aware routes, language switcher,
  English fallback, hreflang and localized metadata
- Initial database schema with Row Level Security
- Tests for the planner, validation, persistence, locale handling, formatting
  and the guest reset flow

Not yet built (waiting for approval): Family Load, Community, accounts and
history.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. You are redirected to your browser language
(for example `/de`), falling back to `/en`.

Other commands:

| Command               | What it does                                  |
| --------------------- | --------------------------------------------- |
| `npm run lint`        | ESLint                                        |
| `npm run typecheck`   | TypeScript                                    |
| `npm test`            | Vitest unit and component tests               |
| `npm run build`       | Production build                              |
| `npm run start`       | Serve the production build                    |
| `npm run check`       | lint, typecheck, tests and build in one go    |
| `npm run i18n:status` | Translation coverage and review status        |
| `npm run screenshots` | Playwright screenshots (app must be running)  |

No environment variables are required for Milestone 1. Copy `.env.example` to
`.env.local` when you set up Supabase (see `supabase/README.md`).

## Architecture

```
src/
  app/                  Routes only. Every page lives under [locale]/.
    [locale]/
      layout.tsx        html/body, fonts, header, footer, metadata + hreflang
      page.tsx          Landing page
      reset/page.tsx    Reset flow
      reset/[id]/       Result page (reads the saved reset on the device)
    robots.ts, sitemap.ts
  components/
    ui/                 Button, Card, Textarea, OptionButton, ProgressBar...
    layout/             Header (mobile sheet), Footer, LanguageSwitcher
  features/
    landing/            Landing page sections
    reset/
      planner/          ResetPlanner interface + DeterministicResetPlanner
      components/       ResetFlow, steps, ResultView, SafetyNotice
      actions.ts        Server action: validation, rate limit, moderation, plan
      schema.ts         Zod schema (character limits count code points)
      safety.ts         Conservative danger-phrase detection
      useResetDraft.ts  sessionStorage-backed draft so interruptions are safe
  i18n/
    locales.ts          Supported locales and native names
    routing.ts          next-intl routing (prefix always, cookie persistence)
    request.ts          Message loading, English fallback, missing-key logging
    detect.ts           Pure Accept-Language matching (tested)
    messages.ts         mergeMessages / findMissingKeys
  lib/
    intl/format.ts      Intl date, number and currency helpers
    rate-limit.ts       In-memory limiter with a documented upgrade path
    moderation.ts       Moderation hook used by server actions
    seo.ts              Canonical + hreflang builder
    supabase/           Browser and server clients (null when not configured)
  services/
    persistence/        ResetRepository interface, Local and Supabase impls
  types/                Shared domain types
messages/               One JSON file per locale (en.json is the source)
supabase/migrations/    SQL schema with RLS
tests/                  Vitest (unit, i18n, components)
scripts/                i18n status, screenshots
```

### Data flow of a reset

1. `ResetFlow` collects answers one question per screen. The draft is kept in
   `sessionStorage` so a phone call or a toddler does not wipe it.
2. On submit, the `submitReset` server action validates with Zod, applies a
   rate limit and moderation hook, runs the planner, and returns a plan plus a
   safety flag. Nothing is stored server-side.
3. The client saves the record through `ResetRepository`. Guests get the local
   implementation. When accounts land, signed-in users get the Supabase one
   with the same interface.
4. The result page renders the plan. Planner items are translation keys, so
   the same plan renders in any language; the user's own words are shown
   verbatim.

### Planner

`DeterministicResetPlanner` is intentionally simple and fully tested. It never
returns English sentences: every generated item is a key under the `planner`
namespace in `messages/*.json`. A future AI planner implements the same
`ResetPlanner` interface and is selected in `features/reset/planner/index.ts`.

## Internationalization

- Routes are locale-prefixed: `/en`, `/de`, `/ja`, ... `/` redirects.
- First visit: browser language → closest supported locale → English.
- Manual choice is stored in the `NEXT_LOCALE` cookie and wins afterwards.
- Missing keys fall back to English at load time and are logged in
  development. They never crash the app.
- Dates, numbers and currency go through `Intl`. Currency is a user
  preference, never derived from the UI language.
- CJK: full Unicode storage, code-point character limits, font fallbacks, no
  space-based word splitting.

### Translation status

`messages/en.json` is the source. All other files were generated
automatically and are marked `"_meta": { "status": "unreviewed" }`. Replace a
file with a reviewed version and update its `_meta` to change the status. Run
`npm run i18n:status` to see coverage.

## Security and privacy

- Server-side validation of every reset submission (Zod).
- Character limits counted in code points, so CJK text is not penalised.
- Control characters stripped; text otherwise stored exactly as written.
- In-memory rate limiting on the server action (swap for a shared store before
  scaling out; see `lib/rate-limit.ts`).
- Moderation hook in place for future community features.
- Security headers set in `next.config.ts`.
- Only the public Supabase URL and anon key ever reach the browser.
- Guests keep everything on their device (max 20 resets). Accounts will use
  RLS-protected tables; deleting a user cascades everywhere.

## Mental-health safety

The app is not a medical or therapy service and says so. If free text
suggests immediate danger, the result page shows a generic safety pathway
(local emergency services, a trusted person, crisis support) without inventing
country-specific numbers. Ordinary stress is never medicalised.

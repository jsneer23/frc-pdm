# FRC Parts Manager

Onshape part exporter and manufacturing queue management tool for FRC Team 5507.

Export Panel Demo: <https://jsneer23.github.io/frc-pdm/onshape>

## How it works

- **Panel** (`apps/ui`): a React single-page app hosted on GitHub Pages and
  embedded in Onshape as a right-side panel.
- **Database and auth** (Supabase): Postgres with row-level security, sign-in
  with emailed codes, and file storage.
- **Edge Functions** (`supabase/functions`): `onshape` creates the part in the
  database and starts the export with Onshape; `onshape-webhook` receives
  Onshape's "export finished" notice and stores the file.

## Local development

Requirements: [mise](https://mise.jdx.dev/) and Docker.

### Environment files

Copy each example and fill it in. The copies are gitignored.

| Copy | To | Contains |
|---|---|---|
| `apps/ui/.env.example` | `apps/ui/.env.local` | Supabase URL and publishable key (from `supabase status`) |
| `supabase/functions/.env.example` | `supabase/functions/.env` | Onshape API keys and webhook signing secrets |
| `supabase/functions/onshape/.env.example` | `supabase/functions/onshape/.env` | `ONSHAPE_DEV=true`: fake Onshape calls locally |

ONSHAPE_DEV mode makes local exports skip Onshape entirely, so they don't spend the
team's yearly API call budget. Leave it on unless you are deliberately
testing a real export.

### Running it

```bash
mise install                 # pinned tool versions (pnpm, Biome, Deno, Supabase CLI)
cd apps/ui && pnpm install && cd ../..
mise run db:start            # local Supabase stack
supabase functions serve     # Edge Functions (own terminal; reads the .env files above)
cd apps/ui && pnpm dev       # http://localhost:3000/onshape
mise run mail                # local inbox for sign-in codes
```
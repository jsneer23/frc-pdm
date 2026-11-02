# apps/ui

The FRC Parts Manager web app: a static React single-page app (TanStack
Router, TanStack Query, Tailwind, shadcn) hosted on GitHub Pages.

```bash
pnpm dev         # http://localhost:3000
pnpm check       # Biome lint + format
pnpm typecheck
pnpm build
```

This is a static app: no server rendering and no server functions. Anything
that needs a secret runs in a Supabase Edge Function instead.

See the [repository README](../../README.md) for how the pieces fit
together and local setup.
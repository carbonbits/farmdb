# FarmDB web

The web app for FarmDB, built with Next.js. It is exported to static files and
served by the FarmDB API, so in normal use you reach it at http://localhost:5700,
not on its own port.

## Shared packages

It uses the workspace packages:

- `@farmdb/api-client` for auth and API calls
- `@farmdb/geo` for the geo feature client and map types
- `@farmdb/ui` for shared interface pieces

## Working on it

From this folder:

```bash
pnpm install
pnpm build      # produces the static build the API serves
pnpm dev        # runs the app on its own for development
```

Set `NEXT_PUBLIC_API_URL` to point the app at a different API host. Left unset,
it uses the current origin, which is what you want when the API serves the app.

## Linting and formatting

```bash
pnpm check      # Biome check and fix
pnpm lint       # Biome check without writing
pnpm format     # Biome format
```

## Maps

The map uses MapLibre. Its worker file is copied into `public/` by
`scripts/maplibre-worker.mjs`, which the `predev` and `prebuild` scripts run
automatically, so you do not need to run it by hand.
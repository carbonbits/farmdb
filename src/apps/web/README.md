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

`pnpm dev` needs an API to talk to; `make dev` from the repo root starts one in
a container and then runs this, which is the shortest path to a working setup.

### How it reaches the API

The client calls the API at relative URLs (`/v1/…`). Served by the API that is
same-origin and needs no configuration, but `pnpm dev` puts this app on :3000,
where a relative `/v1` call would hit the Next dev server and 404. So
`next.config.ts` proxies `/v1`, `/openapi.json`, `/docs` and `/redoc` to the API
while in dev. Point that elsewhere with `API_PROXY_TARGET`:

```bash
API_PROXY_TARGET=http://localhost:8000 pnpm dev
```

Next prints a warning that rewrites "will not automatically work with output:
export" — that is about the static build, which has no server to rewrite
anything and does not need one. The proxy does work under `pnpm dev`.

Leave `NEXT_PUBLIC_API_URL` unset. Setting it makes the client call the API
absolutely, which bypasses the proxy and puts every request on a second origin
— the browser then blocks the response unless the API sends CORS headers, which
it does not by default. It exists for a deployment where the app really is
served from elsewhere; there, set `CORS_ORIGINS` on the API to match.

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
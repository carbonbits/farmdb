# @farmdb/api-client

How the web app and feature packages talk to the FarmDB API: sign-in state,
typed API shapes, and one data layer for reads and writes.

## API types

The types in `src/generated/api.d.ts` are generated from the API's OpenAPI
schema with [openapi-typescript](https://github.com/openapi-ts/openapi-typescript).
Never edit that file by hand. It is excluded from Biome.

`src/types.ts` gives the generated schemas the names the code uses, for example
`type User = Schemas["UserMe"]`, and keeps the few client-side shapes the schema
does not describe. A package that needs a narrower type wraps the generated one
in its own file, for example `Omit<Schema, "geometry"> & { geometry: Polygon }`.

### Regenerating after an API change

With the API running on port 5700:

```sh
pnpm --filter @farmdb/api-client generate
```

The script reads `http://localhost:5700/openapi.json`. To read from somewhere
else, set `FARMDB_OPENAPI_URL` to a URL or a file path.

If the API cannot start, print the schema from the app itself. This does not
open the database:

```sh
docker compose run --rm --no-deps api uv run --no-sync python -c \
  "import json; from main import application; print(json.dumps(application.openapi()))" \
  > /tmp/farmdb-openapi.json
FARMDB_OPENAPI_URL=/tmp/farmdb-openapi.json pnpm --filter @farmdb/api-client generate
```

Commit the regenerated file with the change that needed it. Running `generate`
again with no API change gives no diff.

## Talking to the API

Every request goes through one typed client, `farmdbApi`, built on
[openapi-fetch](https://openapi-ts.dev/openapi-fetch/). Paths and responses are
typed from `src/generated/api.d.ts`, so a wrong path or field name fails to
compile. The client only sends requests to this API's own `/v1/` paths and gives
up after 30 seconds. `unwrap` turns a result into its data, or throws an
`ApiError`.

## Reading data

Components read with `useFarmdbApi`. It adds the signed-in user's token, caches
the result with SWR, and waits until someone is signed in. The response type
comes from the path, so there is nothing to annotate.

```ts
import { farmdbApi, useFarmdbApi } from "@farmdb/api-client";

const { data: fields, error, isLoading, mutate } = useFarmdbApi("/v1/fields/", (authOptions) =>
  farmdbApi.GET("/v1/fields/", authOptions),
);
```

The first argument names the cached data. Pass `null` to skip the request.

## Writing data

Writes call the client directly with the signed-in user's `authOptions`. After a
write, call the `mutate` returned by the matching `useFarmdbApi` so the cached
read refreshes.

```ts
import { farmdbApi, unwrap, useAuthOptions } from "@farmdb/api-client";

const authOptions = useAuthOptions(); // null when signed out

if (authOptions) {
  await unwrap(farmdbApi.POST("/v1/fields/", { ...authOptions, body: { name: "Field A1" } }));
  await mutate();
}
```

## Errors

Every failed call throws an `ApiError` with a `message` and a `status`. Server
faults (5xx) carry a generic message, client errors (4xx) carry the API's own
`detail` text, and a network failure or timeout has status `0`.

## Configuration

`NEXT_PUBLIC_API_URL` sets where the API lives. It is read when the web app is
built. Leave it empty, the default, when the API serves the web app or the dev
server proxies `/v1`. If you set it, use an `https://` address in production:
the user's token travels with every request.

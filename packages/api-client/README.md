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

## Reading data

Every request goes through one fetcher, `farmdbFetcher`. Components read with
`useFarmdbApi`, which adds the signed-in user's token, caches the result with
SWR, and waits until someone is signed in.

```ts
import { type components, useFarmdbApi } from "@farmdb/api-client";

type FarmField = components["schemas"]["FarmField"];

const { data: fields, error, isLoading, mutate } = useFarmdbApi<FarmField[]>({
  path: "/v1/fields/",
});
```

To add a new endpoint call, pass its path, and type the result with the
matching schema from `components["schemas"]`.

## Writing data

Writes use `farmdbMutate`, which goes through the same fetcher. After a write,
call the `mutate` returned by the matching `useFarmdbApi` so the cached read
refreshes.

```ts
import { farmdbMutate } from "@farmdb/api-client";

await farmdbMutate<FarmField, CreateFarmFieldInput>(
  { path: "/v1/fields/", method: "POST", body: { name: "Field A1" } },
  accessToken,
);
await mutate();
```

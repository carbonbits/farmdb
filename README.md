# FarmDB

FarmDB is a platform for managing a farm. A Python API keeps the records and
serves a web app where a farm tracks its fields and land, its crops, and its day
to day work, and controls who has access. It runs as one service a farm can host
itself.

## Stack

- API: Python 3.12, FastAPI, DuckDB (one embedded database file)
- Web: Next.js exported to static files and served by the API, with React and Tailwind
- Tooling: uv for Python, pnpm for the web workspace, Ruff for Python, Biome for the web

## Project layout

```
src/
  config/        settings
  features/      the API, one folder per feature (auth, geo, and so on)
  migrations/    database migrations
  apps/web/      the Next.js web app
packages/        shared web packages (geo, api-client, ui)
cli/             the farmdb command line tool
main.py          starts the API
```

## Requirements

- Python 3.12 or newer
- uv
- Node and pnpm

## Running it

Install the Python dependencies, apply the database migrations, and start the API:

```bash
uv sync
uv run farmdb migration apply
uv run python src/main.py
```

The API and the web app are served together at http://localhost:5700.

The web app is served as a static build, so build it once for the API to serve:

```bash
cd src/apps/web
pnpm install
pnpm build
```

## Configuration

Settings are defined in `src/config/settings.py` and can be overridden with
environment variables in a `.env` file at the repo root. Every setting has a
working default, so a fresh clone runs with no `.env` at all. `.env.example`
lists every variable and what it is for.

To keep logins working across restarts, set a fixed JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Put the result in `.env` as `JWT_SECRET_KEY`.

For a real deployment, set a strong `JWT_SECRET_KEY`, keep your `.env` out of
version control (it is already gitignored), and set the `WEBAUTHN_` values to
your own domain instead of localhost.

## Database migrations

Migrations live in `src/migrations`. Stop the API before applying them, because
DuckDB allows a single writer and cannot migrate the file while the server holds
it. Create and apply migrations with the `farmdb` command:

```bash
uv run farmdb create migration create_farms_table
uv run farmdb migration apply
```

## Tests

```bash
uv run pytest
```

## Linting and formatting

Python:

```bash
uv run ruff format src
uv run ruff check src --fix
```

Web (from `src/apps/web`):

```bash
pnpm check
```

## Contributing

### A key for calling the API

Every endpoint needs a credential, so working on one means holding a key.
Instead of registering through the web app, mint a development key:

```bash
uv run farmdb apikey master
```

It creates (or reuses) a `dev@example.com` user, gives it the `administrator`
role — the system role that holds every permission in the catalog — and prints
an ordinary `fdb_` key. It also tops the role up with any permissions added
since the catalog was seeded, so a key minted today clears the gate on an
endpoint added today. The plaintext is shown once and only its hash is stored,
so copy it there and then; revoke or list it like any other key.

Apply the migrations first, because the command needs the `administrator` role
to exist, and stop the API while it runs, because DuckDB takes a single writer.
It refuses to run unless `ENVIRONMENT` is `dev`.

To check a key, call the metadata endpoint. It needs a principal but no
particular permission, which makes it the smallest thing a working credential
can prove:

```bash
curl -H "Authorization: Bearer $FARMDB_KEY" http://localhost:5700/v1/metadata
```

It answers with this farm's id and creation date, the running version, and the
database's size on disk. A 200 means the credential resolved; a 401 means it did
not, and a 403 anywhere else means the key is fine but the role is missing a
permission.

### Layout todo
`src/` reads as "the source", but it is really the Python distribution root
(`pyproject.toml` sets `package-dir = {"" = "src"}`, so every top-level dir under
it is an importable package) that happens to also contain a Next.js app. Three
steps to sort that out, in order — the first is mechanical, the last is a design
conversation.

- [ ] **Move `src/apps/web` to `apps/web` at the repo root**, alongside
      `packages/`. Today `pnpm-workspace.yaml` reaches into `src/apps/*` for it
      while its siblings live in `packages/*`, so the frontend is addressed from
      two directions at once; afterwards the globs are just `apps/*` and
      `packages/*`, and no JS sits inside the Python package tree. No Python
      changes. Touches `pnpm-workspace.yaml`, `spa_directory` in
      `src/apps/api/middleware/spa.py` (a `parents[2]` hop that stops working
      once `web` is not a sibling), the three `src/apps/web` paths in the
      `Dockerfile`, and the watched directory in `.github/dependabot.yml`.
- [ ] **Decide whether `src/apps/api` still needs to be under `apps/`** once it
      is the only thing there. Probably flatten it.
- [ ] **Revisit the `core/` vs `features/` boundary.** Both contain `geo`, and
      `core/auth` sits next to `features/apikey`. The split seems to be "engine
      vs HTTP feature", which is fine, but nothing in the names says so, so
      anyone adding code has to guess. Name the rule, then move things to match.

Also: `utils/` is a name that attracts anything homeless. Keep it to
cross-cutting framework glue (the error handlers, middleware, maybe
`config/utils.py`) and write that rule into `src/utils/__init__.py`, or it ends
up as the drawer with the batteries and the dead pens in it.
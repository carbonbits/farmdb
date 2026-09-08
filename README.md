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
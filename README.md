Manage your farm professionally

### Run with Docker Compose

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(32))"  # paste the output into JWT_SECRET_KEY in .env
docker compose up
```

Open [http://localhost:5700](http://localhost:5700). Migrations run automatically on
startup; the DuckDB file persists in a named volume across restarts.

### Migrations
Example

`uv run farmdb create migration create_farms_table`

`uv run farmdb migration apply`

### Authentication
Generate a secret

`python -c "import secrets; print(secrets.token_urlsafe(32))"`

### Ruff
`uv run ruff format src`

`uv run ruff check src --fix`
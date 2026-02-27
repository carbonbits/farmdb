Manage your farm professionally

### Migrations
Example

`uv run farmdb create migration create_farms_table`

`uv run farmdb migration apply`

### Authentication
Generate a secret

`python -c "import secrets; print(secrets.token_urlsafe(32))"`
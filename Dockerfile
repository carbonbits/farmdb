# Build the static web app.
#
# The app imports workspace packages that live outside its own folder, so the
# whole pnpm workspace comes along: root manifest, lockfile, packages/ and the
# app itself. Manifests are copied before the sources so a code change does not
# re-resolve the dependency tree.
FROM node:26-slim AS web-builder

# Installed explicitly rather than through corepack, which recent Node images
# no longer all ship. Keep the version in step with the root package.json's
# packageManager field.
RUN npm install --global pnpm@11.13.0

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY src/apps/web/package.json ./src/apps/web/

RUN pnpm install --frozen-lockfile --filter web...

COPY src/apps/web/ ./src/apps/web/

RUN pnpm --filter web build

# The API as local development runs it.
#
# Dev dependencies included, and no web assets: compose bind-mounts the repo
# over /app and the Next dev server serves the UI from the host. The virtualenv
# is deliberately outside /app, because that mount would otherwise shadow it
# with the host's macOS-built .venv. Sources are still copied in so the editable
# install has something to point at during the build; the mount replaces them.
#
# Kept above the runtime stage on purpose: `docker build .` with no --target
# builds the last stage, which must stay the production image.
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS api-dev

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_COMPILE_BYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    # The mounted tree is the developer's own working copy: this container runs
    # as root, so leave no root-owned __pycache__ behind in it.
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY pyproject.toml uv.lock README.md ./
COPY src/ ./src/

RUN uv sync --frozen

EXPOSE 5700

CMD ["uv", "run", "--no-sync", "python", "src/main.py"]

# The production image: the API plus the exported web app it serves.
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS runtime

RUN groupadd --gid 1000 shamba && \
    useradd --uid 1000 --gid shamba --shell /bin/bash --create-home mkulima

WORKDIR /app

COPY --chown=mkulima:shamba pyproject.toml uv.lock README.md ./
COPY --chown=mkulima:shamba src/ ./src/
COPY --from=web-builder --chown=mkulima:shamba /repo/src/apps/web/out ./src/apps/web/out

RUN uv sync --frozen --no-dev && chown -R mkulima:shamba /app

USER mkulima
ENV PYTHONPATH=/app/src

EXPOSE 5700

CMD ["uv", "run", "src/main.py"]

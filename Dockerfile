# Build Next.js static site
FROM node:25-slim AS web-builder
WORKDIR /web
COPY src/apps/web/package*.json ./
RUN npm ci
COPY src/apps/web ./
RUN npm run build

# Build Python app
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

RUN groupadd --gid 1000 shamba && \
    useradd --uid 1000 --gid shamba --shell /bin/bash --create-home mkulima

WORKDIR /app

COPY --chown=mkulima:shamba pyproject.toml uv.lock README.md ./
COPY --chown=mkulima:shamba src/ ./src/
COPY --from=web-builder --chown=mkulima:shamba /web/out ./src/apps/web/out

RUN uv sync --frozen --no-dev && chown -R mkulima:shamba /app

USER mkulima
ENV PYTHONPATH=/app/src

EXPOSE 5700

CMD ["uv", "run", "src/main.py"]
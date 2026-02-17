FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

RUN groupadd --gid 1000 shamba && \
    useradd --uid 1000 --gid shamba --shell /bin/bash --create-home mkulima

WORKDIR /app

COPY --chown=mkulima:shamba pyproject.toml uv.lock README.md ./
COPY --chown=mkulima:shamba src/ ./src/

RUN uv sync --frozen --no-dev && chown -R mkulima:shamba /app

USER mkulima
ENV PYTHONPATH=/app/src

EXPOSE 5700

CMD ["uv", "run", "src/main.py"]
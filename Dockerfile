FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
COPY src/ ./src/
RUN uv sync --frozen --no-dev
ENV PYTHONPATH=/app/src
EXPOSE 5700
CMD ["uv", "run", "src/main.py"]
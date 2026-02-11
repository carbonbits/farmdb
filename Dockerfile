FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock README.md ./
COPY src/ ./src/
RUN uv sync --frozen --no-dev
ENV PYTHONPATH=/app/src
EXPOSE 5700
CMD ["uv", "run", "uvicorn", "main:application", "--host", "0.0.0.0", "--port", "5700"]
FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src/ ./src/
ENV PYTHONPATH=/app/src
EXPOSE 5700
CMD ["uv", "run", "uvicorn", "main:application", "--host", "0.0.0.0", "--port", "5700"]

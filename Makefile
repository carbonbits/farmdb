# Everyday commands for working on FarmDB.
#
# The API runs in a container (see compose.yaml) and the web app runs on the
# host, where hot reload is quick. `make dev` starts both.

COMPOSE := docker compose
# A one-off container with the same image, mounts and volumes as the service.
# How anything touching the database runs, because DuckDB takes a single writer
# and the API holds it while it is up.
RUN_ONE := $(COMPOSE) run --rm --no-deps api

.DEFAULT_GOAL := help
.PHONY: help up down logs dev api-logs migrate key shell test lint reset

help: ## Show this help
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Start the API on http://localhost:5700 (applies migrations first)
	$(COMPOSE) up -d
	@echo "API on http://localhost:5700 — docs at /docs"

down: ## Stop the API
	$(COMPOSE) down

logs: ## Follow the API logs
	$(COMPOSE) logs -f api

dev: up ## Start the API, then the web app on http://localhost:3000
	pnpm --filter web dev

migrate: ## Apply pending migrations (stops the API for the write)
	$(COMPOSE) stop api
	$(RUN_ONE) uv run --no-sync farmdb migration apply
	$(COMPOSE) start api

key: ## Mint an all-permissions API key for local testing
	$(COMPOSE) stop api
	$(RUN_ONE) uv run --no-sync farmdb apikey master
	$(COMPOSE) start api

shell: ## A shell in the API container
	$(COMPOSE) exec api bash

test: ## Run the Python tests in the container
	$(RUN_ONE) uv run --no-sync pytest

lint: ## Format and check Python, then the web workspace
	uv run ruff format src
	uv run ruff check src --fix
	pnpm lint

reset: ## Delete the container's database and start over
	$(COMPOSE) down -v
	$(COMPOSE) up -d

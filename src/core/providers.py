"""
Service registry — a Laravel-style provider list.

`PROVIDERS` is the single, ordered list of service providers, analogous to
Laravel's `config/app.php` 'providers' array. Each provider's `register()` returns
the injectables (drivers) for its domain, selecting open-core vs alternative
implementations from settings. The container is built from the flattened result.

To swap implementations in an enterprise fork: replace a provider in PROVIDERS,
append a new one, or override the driver map — all in this one file, without
touching call sites.
"""

from __future__ import annotations

from typing import Protocol

from config.settings import settings
from core.auth.apikeys.store import DuckDBApiKeyStore
from core.auth.resolver import DefaultPrincipalResolver
from core.authz.local import LocalAuthzService
from core.authz.platform import PlatformAuthzService


class ServiceProvider(Protocol):
    def register(self) -> list:
        """Return the injectables this provider contributes to the container."""
        ...


class AuthzServiceProvider:
    drivers = {
        "local": LocalAuthzService,
        "platform": PlatformAuthzService,
    }

    def register(self) -> list:
        return [self.drivers[settings.authz_driver]]


class AuthServiceProvider:
    def register(self) -> list:
        # DefaultPrincipalResolver depends on ApiKeyStore (constructor injection).
        return [DuckDBApiKeyStore, DefaultPrincipalResolver]


# The registry. Enterprise builds replace/extend entries here.
PROVIDERS: list[ServiceProvider] = [
    AuthzServiceProvider(),
    AuthServiceProvider(),
]


def collect_injectables() -> list:
    injectables: list = []
    for provider in PROVIDERS:
        injectables.extend(provider.register())
    return injectables

"""
DI composition root.

Builds the wireup container the API runs against from the service registry
(see core.providers). Driver selection lives in the providers, so this stays a
thin assembly point; an enterprise fork swaps implementations there.
"""

from __future__ import annotations

import wireup

from core.providers import collect_injectables


def build_container() -> wireup.AsyncContainer:
    return wireup.create_async_container(injectables=collect_injectables())

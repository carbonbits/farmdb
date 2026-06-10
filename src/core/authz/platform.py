"""
Platform authorization driver.

Talks to the external platform authz API (api.carbonbits.work/platform/v1/authz/can).
Fails closed: any error results in a denied check. Selected by setting
`authz_driver = "platform"`; the open-core default is the local driver.
"""

from __future__ import annotations

import logging

import httpx
from wireup import injectable

from config.settings import settings
from core.authz.base import AuthzService, AuthzTuple

logger = logging.getLogger(__name__)


@injectable(as_type=AuthzService)
class PlatformAuthzService(AuthzService):
    def _headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if settings.cf_access_client_id:
            headers["CF-Access-Client-Id"] = settings.cf_access_client_id
        if settings.cf_access_client_secret:
            headers["CF-Access-Client-Secret"] = settings.cf_access_client_secret
        return headers

    async def can(self, tuple_: AuthzTuple, context: str, context_id: str) -> bool:
        payload = {
            "checks": [
                {
                    "user": tuple_.user,
                    "relation": tuple_.relation,
                    "object": tuple_.object,
                }
            ],
            "context": context,
            "context_id": context_id,
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.platform_api_url}/platform/v1/authz/can",
                    json=payload,
                    headers=self._headers(),
                )
                resp.raise_for_status()
                results = resp.json().get("results", {})
                values = list(results.values())
                return values[0] is True if values else False
        except Exception:
            logger.exception("[authz/can] request failed — denying by default")
            return False

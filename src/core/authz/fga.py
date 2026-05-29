"""
farmdb direct OpenFGA client.
farmdb is independent connects to OpenFGA directly via SDK.
Store and model IDs come from the organization data.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from openfga_sdk import ClientConfiguration, OpenFgaClient
from openfga_sdk.client.models import ClientCheckRequest

from settings import settings

logger = logging.getLogger(__name__)


@dataclass
class FGATuple:
    user: str
    relation: str
    object: str


class FGAClient:
    async def can(
        self,
        tuple_: FGATuple,
        store_id: str,
        model_id: str,
    ) -> bool:
        try:
            config = ClientConfiguration(
                api_url=settings.openfga_api_url,
                store_id=store_id,
                authorization_model_id=model_id,
            )
            async with OpenFgaClient(config) as client:
                response = await client.check(
                    ClientCheckRequest(
                        user=tuple_.user,
                        relation=tuple_.relation,
                        object=tuple_.object,
                    )
                )
                return response.allowed is True
        except Exception:
            logger.exception("[fga/check] failed — denying by default")
            return False


fga_client = FGAClient()
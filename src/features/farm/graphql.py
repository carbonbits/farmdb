"""
Farm GraphQL mutations.
Transport only — calls the same handler as REST.
"""

from __future__ import annotations

import strawberry
from strawberry.types import Info

from core.storage.database import DB
from features.farm.handlers.create.handler import PermissionDenied, create_farm
from features.farm.handlers.create.input import CreateFarmInput
from features.farm.models.farm import Farm


@strawberry.experimental.pydantic.input(model=CreateFarmInput, all_fields=True)
class CreateFarmGraphQLInput:
    pass


@strawberry.type
class FarmMutation:
    @strawberry.mutation
    async def create_farm(
        self,
        info: Info,
        input: CreateFarmGraphQLInput,
    ) -> Farm:
        request = info.context["request"]
        user_id = request.headers.get("x-user-id", "")
        org_id = request.headers.get("x-account-id", "")

        if not user_id or not org_id:
            raise strawberry.exceptions.StrawberryGraphQLError(
                message="Missing required headers: x-user-id, x-account-id",
                extensions={"code": "BAD_REQUEST"},
            )

        try:
            model = await create_farm(
                input_=input.to_pydantic(),
                conn=DB.get_connection(),
                user_id=user_id,
                org_id=org_id,
            )
            return Farm.from_pydantic(model)
        except PermissionDenied:
            raise strawberry.exceptions.StrawberryGraphQLError(
                message="Permission denied: create_farm",
                extensions={"code": "PERMISSION_DENIED"},
            )

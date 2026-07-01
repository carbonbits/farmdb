from __future__ import annotations

from duckling import get_session

from core.auth.principal import Principal
from features.crop.handlers.create.input import CreateCropInput
from features.crop.models.activity import Activity
from features.crop.models.crop import Crop


async def create_crop(input_: CreateCropInput, principal: Principal) -> Crop:
    crop = Crop(
        field_id=input_.field_id,
        name=input_.name,
        variety=input_.variety,
        description=input_.description,
        created_by=principal.user_id,
    )

    activity = Activity(
        actor_id=principal.user_id,
        actor_email=principal.email,
        action="crop.created",
        entity_type="crop",
        entity_id=crop.id,
        metadata={
            "crop_id": crop.id,
            "field_id": input_.field_id,
            "name": input_.name,
            "variety": input_.variety,
            "description": input_.description,
        },
    )

    async with get_session().async_transaction():
        await crop.insert()
        await activity.insert()

    return crop

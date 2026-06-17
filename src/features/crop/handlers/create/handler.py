from __future__ import annotations

import json
from datetime import datetime, timezone

import duckdb
from ulid import ULID

from core.auth.principal import Principal
from features.crop.handlers.create.input import CreateCropInput
from features.crop.models.crop import CropModel


def _build_description(principal: Principal, crop_name: str, at: datetime) -> str:
    timestamp = at.strftime("%Y-%m-%d %I:%M %p")
    return f"User {principal.email} created crop {crop_name} at {timestamp}"


async def create_crop(
    input_: CreateCropInput,
    conn: duckdb.DuckDBPyConnection,
    principal: Principal,
) -> CropModel:
    crop_id = str(ULID())
    activity_id = str(ULID())
    now = datetime.now(timezone.utc)

    conn.execute(
        """
        INSERT INTO v1.crops (id, field_id, name, variety, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            crop_id,
            input_.field_id,
            input_.name,
            input_.variety,
            input_.description,
            principal.user_id,
        ],
    )

    metadata = json.dumps(
        {
            "crop_id": crop_id,
            "field_id": input_.field_id,
            "name": input_.name,
            "variety": input_.variety,
            "description": input_.description,
        }
    )

    conn.execute(
        """
        INSERT INTO v1.activities (
            id,
            actor_id,
            actor_email,
            action,
            entity_type,
            entity_id,
            description,
            metadata,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            activity_id,
            principal.user_id,
            principal.email,
            "crop.created",
            "crop",
            crop_id,
            _build_description(principal, input_.name, now),
            metadata,
            now,
        ],
    )

    row = conn.execute(
        """
        SELECT id, field_id, name, variety, description,
               created_by, is_active, created_at, updated_at
        FROM v1.crops
        WHERE id = ?
        """,
        [crop_id],
    ).fetchone()

    return CropModel(
        id=row[0],
        field_id=row[1],
        name=row[2],
        variety=row[3],
        description=row[4],
        created_by=row[5],
        is_active=row[6],
        created_at=row[7],
        updated_at=row[8],
    )

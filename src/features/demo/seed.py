"""
The demo seed: sample accounts, a farm outline, fields and crops for a public
demo instance.

Everything goes through the app's own services and handlers, never raw
inserts, so the demo holds only what a real user could have made, checked the
same way. Each step looks for its item first and creates only what is missing,
so running the seed again changes nothing.
"""

from dataclasses import dataclass, field

import duckdb

from config.settings import settings
from core.auth.models import User
from core.auth.principal import Principal
from core.auth.service import AuthService
from core.authz.service import AuthzService
from core.geo.service import GeospatialService
from core.storage.database import db
from features.crop.handlers.create.handler import create_crop
from features.crop.handlers.create.input import CreateCropInput
from features.crop.models.crop import Crop
from features.demo import data
from features.demo.errors import DemoSeedRefused
from features.field.handlers.create.handler import create_field
from features.field.handlers.create.input import CreateFarmFieldInput
from features.field.queries import read_fields
from features.geo.handlers.create.handler import create_feature
from features.geo.handlers.create.input import CreateFeatureInput


@dataclass
class SeedSummary:
    created: list[str] = field(default_factory=list)
    already_present: list[str] = field(default_factory=list)


async def seed_demo() -> SeedSummary:
    """Fill a demo instance. Call after start_core(), on a migrated database."""
    password = _demo_password()
    summary = SeedSummary()
    authz = AuthzService()

    owner = await _seed_accounts(AuthService(), authz, password, summary)
    principal = Principal(user_id=owner.id, email=owner.email, auth_method="cli")
    conn = db()
    geo = GeospatialService(conn=conn)

    await _seed_farm_outline(geo, authz, principal, summary)
    field_ids = await _seed_fields(conn, authz, owner.id, summary)
    await _seed_crops(field_ids, principal, summary)
    return summary


def _demo_password() -> str:
    # Fail closed: only an instance marked as a demo may be seeded, so sample
    # data can never land in a real farm's database.
    if not settings.demo:
        raise DemoSeedRefused(
            "DEMO is not true. The demo seed only runs on a demo instance."
        )
    if not settings.demo_password:
        raise DemoSeedRefused("DEMO_PASSWORD is not set.")
    return settings.demo_password


async def _seed_accounts(
    auth: AuthService, authz: AuthzService, password: str, summary: SeedSummary
) -> User:
    owner = None
    for account in data.ACCOUNTS:
        user = auth.get_user_by_email(account.email)
        if user is None:
            user = auth.create_user(
                email=account.email,
                password=password,
                display_name=account.display_name,
            )
            summary.created.append(f"account {account.email}")
        else:
            # The published password must work after every run.
            auth.set_password(user.id, password)
            summary.already_present.append(f"account {account.email}")

        # Assigned explicitly rather than trusting "the first registrant is the
        # administrator", which would fail if anyone had signed up first.
        role = authz.get_role_by_name(account.role)
        if role is None:
            raise DemoSeedRefused(
                f"Role {account.role} does not exist. Apply the migrations first."
            )
        await authz.assign_role_to_user(user.id, role["id"])

        if account.role == "administrator":
            owner = user

    if owner is None:
        raise DemoSeedRefused("The demo data has no administrator account.")
    return owner


async def _seed_farm_outline(
    geo: GeospatialService,
    authz: AuthzService,
    principal: Principal,
    summary: SeedSummary,
) -> None:
    if geo.farm_outline() is not None:
        summary.already_present.append("farm outline")
        return

    await create_feature(
        collection_id="farm",
        input_=CreateFeatureInput(
            geometry=data.FARM_OUTLINE, properties={"name": data.FARM_NAME}
        ),
        geo=geo,
        authz=authz,
        principal=principal,
    )
    summary.created.append("farm outline")


async def _seed_fields(
    conn: duckdb.DuckDBPyConnection,
    authz: AuthzService,
    owner_id: str,
    summary: SeedSummary,
) -> dict[str, str]:
    field_ids = {existing.name: existing.id for existing in read_fields(conn, owner_id)}

    for demo_field in data.FIELDS:
        if demo_field.name in field_ids:
            summary.already_present.append(f"field {demo_field.name}")
            continue

        created = await create_field(
            input_=CreateFarmFieldInput(
                name=demo_field.name,
                description=demo_field.description,
                geometry=demo_field.boundary,
            ),
            conn=conn,
            user_id=owner_id,
            authz=authz,
        )
        field_ids[demo_field.name] = created.id
        summary.created.append(f"field {demo_field.name}")

    return field_ids


async def _seed_crops(
    field_ids: dict[str, str], principal: Principal, summary: SeedSummary
) -> None:
    for demo_crop in data.CROPS:
        field_id = field_ids[demo_crop.field_name]
        existing = await Crop.find_one(
            Crop.field_id == field_id, Crop.name == demo_crop.name
        )
        if existing is not None:
            summary.already_present.append(
                f"crop {demo_crop.name} in {demo_crop.field_name}"
            )
            continue

        await create_crop(
            CreateCropInput(
                field_id=field_id,
                name=demo_crop.name,
                variety=demo_crop.variety,
                description=demo_crop.description,
            ),
            principal,
        )
        summary.created.append(f"crop {demo_crop.name} in {demo_crop.field_name}")

"""
The discovery documents: landing page, conformance declaration, collections.

A client that knows only /v1/maps/ can walk from here to every shape the farm
holds. Collections are the registry's layers, filtered to the ones the caller
may view — a map should not advertise a layer it would then refuse to serve.

Like the rest of the API these need a principal. Fail closed: the layer list
says something about the farm, so it is not offered to an anonymous caller.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from core.geo.layers import all_layers, get_layer
from features.geo.deps import Geo
from features.geo.links import JSON, PREFIX, absolute, collection_links
from features.geo.models.ogc import (
    Collection,
    Collections,
    ConformanceDeclaration,
    LandingPage,
    Link,
)
from features.geo.permissions import ensure_permission

router = APIRouter()

# What we actually satisfy, not what we would like to claim. The responses are
# GeoJSON and the tiles are MVT, so those classes are honest. OGC API - Features
# `conf/core` is deliberately absent: it requires the limit and bbox query
# parameters, link objects on every response and numberMatched/numberReturned on
# a feature collection, none of which this build implements yet. Adding them is
# the one step between here and claiming core.
CONFORMANCE = [
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson",
    "http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/mvt",
]


@router.get("/", response_model=LandingPage)
async def landing_page(
    request: Request,
    principal: Annotated[Principal, Depends(require_principal)],
) -> LandingPage:
    """Where a client starts: links to everything else the map API offers."""
    return LandingPage(
        title="FarmDB maps",
        description="Field boundaries, infrastructure and markers for this farm.",
        links=[
            Link(
                href=absolute(request, f"{PREFIX}/"),
                rel="self",
                type=JSON,
                title="This document",
            ),
            Link(
                href=absolute(request, f"{PREFIX}/conformance"),
                rel="conformance",
                type=JSON,
                title="What this API conforms to",
            ),
            Link(
                href=absolute(request, f"{PREFIX}/collections"),
                rel="data",
                type=JSON,
                title="The map layers",
            ),
            Link(
                href=absolute(request, "/openapi.json"),
                rel="service-desc",
                type="application/vnd.oai.openapi+json;version=3.1",
                title="API definition",
            ),
            Link(
                href=absolute(
                    request, f"{PREFIX}/wms?SERVICE=WMS&REQUEST=GetCapabilities"
                ),
                rel="alternate",
                type="text/xml",
                title="WMS capabilities",
            ),
        ],
    )


@router.get("/conformance", response_model=ConformanceDeclaration)
async def conformance(
    principal: Annotated[Principal, Depends(require_principal)],
) -> ConformanceDeclaration:
    """The OGC conformance classes this build satisfies."""
    return ConformanceDeclaration(conformsTo=CONFORMANCE)


@router.get("/collections", response_model=Collections)
async def list_collections(
    request: Request,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> Collections:
    """Every layer the caller may view, with its extent and links."""
    visible = [
        layer
        for layer in all_layers()
        if await authz.can(principal.user_id, layer.view)
    ]

    return Collections(
        collections=[
            Collection.build(
                layer, geo.extent(layer.name), collection_links(request, layer)
            )
            for layer in visible
        ],
        links=[
            Link(
                href=absolute(request, f"{PREFIX}/collections"),
                rel="self",
                type=JSON,
                title="This document",
            )
        ],
    )


@router.get("/collections/{collection_id}", response_model=Collection)
async def get_collection(
    collection_id: str,
    request: Request,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> Collection:
    """One layer. Requires the layer's view permission."""
    layer = get_layer(collection_id)
    await ensure_permission(authz, principal.user_id, layer.view)

    return Collection.build(
        layer, geo.extent(layer.name), collection_links(request, layer)
    )

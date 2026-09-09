"""
The WMS endpoint: one KVP entry point at /v1/maps/wms.

WMS predates REST — everything arrives as query-string parameters on a single
URL, and parameter names are case-insensitive, so SERVICE, Service and service
are all the same parameter. That is why this is one route with a dispatcher
rather than a path per operation.

What works today: GetCapabilities, built from the layer registry and filtered to
the layers the caller may view, which is enough for a desktop GIS to connect and
list what the farm holds. GetMap needs a rasterizer this build does not have, so
it answers 501 and says so.

WMS conventionally returns a ServiceExceptionReport with HTTP 200. We send the
report with a real status code instead: a 501 is more use to everything between
here and the client than a 200 carrying an error document.
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Request, Response, status

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.service import AuthzService, get_authz_service
from core.geo.layers import all_layers
from features.geo.deps import Geo
from features.geo.handlers.wms.capabilities import (
    WMS_VERSION,
    build,
    exception_report,
)
from features.geo.links import PREFIX, XML, absolute

router = APIRouter()

_MEDIA_TYPE = f"{XML}; charset=utf-8"
# Operations a WMS may offer that this build knows of but cannot answer yet.
_UNIMPLEMENTED = {"getmap", "getfeatureinfo", "getlegendgraphic"}


def _xml(body: bytes, status_code: int = status.HTTP_200_OK) -> Response:
    return Response(content=body, media_type=_MEDIA_TYPE, status_code=status_code)


def _error(code: str, message: str, locator: str, status_code: int) -> Response:
    return _xml(exception_report(code, message, locator), status_code)


@router.get("/wms")
async def wms(
    request: Request,
    geo: Geo,
    authz: Annotated[AuthzService, Depends(get_authz_service)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> Response:
    """The OGC WMS entry point. REQUEST=GetCapabilities is what works today."""
    # WMS parameter names are case-insensitive; their values are not, except for
    # the handful we compare ourselves, which we fold to lower case.
    params = {key.lower(): value for key, value in request.query_params.items()}
    service = params.get("service", "WMS")
    operation = params.get("request", "")

    if service.upper() != "WMS":
        return _error(
            "InvalidParameterValue",
            f"This endpoint serves WMS, not {service}.",
            "SERVICE",
            status.HTTP_400_BAD_REQUEST,
        )

    if not operation:
        return _error(
            "MissingParameterValue",
            "REQUEST is required, for example REQUEST=GetCapabilities.",
            "REQUEST",
            status.HTTP_400_BAD_REQUEST,
        )

    if operation.lower() == "getcapabilities":
        return await _capabilities(
            request, geo, authz, principal, params.get("version")
        )

    if operation.lower() in _UNIMPLEMENTED:
        return _error(
            "OperationNotSupported",
            f"{operation} is not implemented yet. Use the vector tile endpoint "
            f"under {PREFIX}/collections/{{collectionId}}/tiles for map data.",
            "REQUEST",
            status.HTTP_501_NOT_IMPLEMENTED,
        )

    return _error(
        "OperationNotSupported",
        f"Unknown request: {operation}.",
        "REQUEST",
        status.HTTP_400_BAD_REQUEST,
    )


async def _capabilities(
    request: Request,
    geo: Geo,
    authz: AuthzService,
    principal: Principal,
    version: Optional[str],
) -> Response:
    """Describe the layers this caller may view."""
    if version is not None and version != WMS_VERSION:
        return _error(
            "InvalidParameterValue",
            f"Only WMS {WMS_VERSION} is served.",
            "VERSION",
            status.HTTP_400_BAD_REQUEST,
        )

    visible = [
        layer
        for layer in all_layers()
        if await authz.can(principal.user_id, layer.view)
    ]

    return _xml(
        build(
            wms_url=absolute(request, f"{PREFIX}/wms"),
            title="FarmDB maps",
            abstract="Field boundaries, infrastructure and markers for this farm.",
            layers=[(layer, geo.extent(layer.name)) for layer in visible],
        )
    )

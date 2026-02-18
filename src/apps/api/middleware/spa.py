from pathlib import Path
from fastapi import Request
from fastapi.responses import FileResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Navigate from src/apps/api/middleware/ up to src/apps/web/out
spa_directory = Path(__file__).parents[2] / "web" / "out"
excluded_prefixes = ("/v1/", "/docs", "/redoc", "/openapi.json")

class SPAMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        path = request.url.path

        if (
            response.status_code == 404
            and not path.startswith(excluded_prefixes)
            and spa_directory.exists()
        ):
            file_path = spa_directory / path.lstrip("/")
            if file_path.is_file():
                return FileResponse(file_path)
            index = spa_directory / path.lstrip("/") / "index.html"
            if index.is_file():
                return FileResponse(index)
            return FileResponse(spa_directory / "index.html")

        return response

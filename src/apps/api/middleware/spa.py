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
            clean_path = path.lstrip("/")

            # Check for exact file match
            file_path = spa_directory / clean_path
            if file_path.is_file():
                return FileResponse(file_path)

            # Check for .html file (Next.js static export format)
            html_file = spa_directory / f"{clean_path}.html"
            if html_file.is_file():
                return FileResponse(html_file)

            # Check for directory with index.html
            index = spa_directory / clean_path / "index.html"
            if index.is_file():
                return FileResponse(index)

            # Fallback to root index.html for SPA routing
            return FileResponse(spa_directory / "index.html")

        return response

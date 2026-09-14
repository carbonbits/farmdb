from __future__ import annotations

from pydantic import BaseModel


class SkippedFeature(BaseModel):
    """A feature that was not imported: where it sat in the upload, and why."""

    index: int
    reason: str


class ImportResult(BaseModel):
    """The outcome of an import: how many landed and which were skipped."""

    imported: int
    skipped: list[SkippedFeature]
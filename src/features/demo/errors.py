"""
Errors raised by the demo seed.

The seed runs from a CLI command, so like core.geo it raises a plain exception
that names a kind from core.errors rather than anything HTTP-specific.
"""

from __future__ import annotations

from core.errors import Conflict


class DemoSeedRefused(Conflict):
    """The instance is not in a state the seed can run in."""

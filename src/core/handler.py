"""
The base every handler extends, alongside core/service.py.

A service is the seam a caller reaches for; a handler is one piece of the work
behind it. Splitting them this way keeps a service readable — it decides the
order things happen in and owns the connection — while the SQL and the rules
sit in a handler that can be read, tested and replaced on its own.

Handlers are constructed by their service, not by callers, so nothing here
concerns itself with dependency injection.
"""

from abc import ABC, abstractmethod

from loguru import logger


class BaseHandler(ABC):
    @property
    @abstractmethod
    def handler_signature(self) -> str:
        """Each handler must define its unique signature."""
        ...


class Handler(BaseHandler):
    """Concrete base handler with common functionality."""

    def __init__(self):
        self.logger = logger.bind(handler=self.handler_signature)

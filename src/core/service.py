from abc import ABC, abstractmethod

from loguru import logger


class BaseService(ABC):
    @property
    @abstractmethod
    def service_signature(self) -> str:
        """Each service must define its unique signature."""
        ...


class Service(BaseService):
    """Concrete base service with common functionality."""

    def __init__(self):
        self.logger = logger.bind(service=self.service_signature)

from core.service import Service


class FarmService(Service):
    @property
    def service_signature(self) -> str:
        return "farm_svc"
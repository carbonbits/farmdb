from features.farm.service import FarmService


class TestFarmService:
    def test_service_signature(self):
        service = FarmService()
        assert service.service_signature == "farm_svc"

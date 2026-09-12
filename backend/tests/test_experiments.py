import pytest
from app.ml.models.experiment import Experiment
from app.ml.services.experiment_service import experiment_service

def test_experiment_creation():
    # A dummy test to ensure the schema allows creation and structure matches requirements
    exp = Experiment(
        experimentId="exp-123",
        name="Test Experiment",
        datasetId="dataset-123",
        centralizedModelId="cent-123",
        federatedModelId="fed-123"
    )
    assert exp.experimentId == "exp-123"
    assert exp.status == "CREATED"
    assert exp.randomSeed == 42
    assert exp.centralizedMetrics is None

@pytest.mark.asyncio
async def test_experiment_validation_fails_on_dataset_mismatch(mocker):
    # Mock the ML repository
    mock_repo = mocker.patch("app.ml.services.experiment_service.ml_repository")
    
    class MockModel:
        def __init__(self, d_id):
            self.datasetId = d_id
            
    # Centralized model uses dataset A, Federated uses dataset B
    mock_repo.get_model.side_effect = [MockModel("dataset-A"), MockModel("dataset-B")]
    
    class MockReq:
        name = "test"
        description = "test"
        centralizedModelId = "1"
        federatedModelId = "2"
        randomSeed = 42
        
    import pytest
    with pytest.raises(ValueError, match="Models must be trained on the same dataset for a fair comparison"):
        await experiment_service.create_experiment(MockReq())

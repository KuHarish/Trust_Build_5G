import os
import uuid
import time
import logging
import asyncio
import numpy as np
import pandas as pd
from typing import Dict, Any, List

import flwr as fl
from flwr.common import ndarrays_to_parameters

from app.federated.models.federated_models import FederatedJob, FederatedRound, FederatedClient
from app.federated.schemas.federated import FederatedConfig
from app.federated.repositories.federated_repository import federated_repository
from app.federated.services.partition_service import partition_service
from app.federated.clients.flower_client import TrustChainClient
from app.federated.strategies.custom_fedavg import TrustChainFedAvg
from app.ml.repositories.ml_repository import ml_repository
from app.ml.models.ml_model import MLModel
from app.ml.services.model_artifact_service import model_artifact_service

logger = logging.getLogger("trustchain.federated.training_service")

class FederatedTrainingService:
    def __init__(self):
        self.active_simulations = {}
        
    async def start_federated_job(self, config: FederatedConfig) -> str:
        # Check if already running
        active_job = await federated_repository.get_active_job()
        if active_job:
            raise ValueError(f"A federated job ({active_job.jobId}) is already running.")
            
        job_id = str(uuid.uuid4())
        
        job = FederatedJob(
            jobId=job_id,
            config=config.model_dump(),
            status="STARTING",
            totalRounds=config.trainingRounds,
            participatingClients=config.totalClients
        )
        
        await federated_repository.save_job(job)
        
        # Start background task
        loop = asyncio.get_running_loop()
        loop.create_task(self._run_simulation(job_id, config))
        
        return job_id

    async def _update_job(self, job_id: str, status: str, step: str = None, error: str = None, current_round: int = None):
        job = await federated_repository.get_job(job_id)
        if job:
            if status: job.status = status
            if step: job.currentStep = step
            if error: job.error = error
            if current_round is not None: job.currentRound = current_round
            await federated_repository.save_job(job)

    async def _run_simulation(self, job_id: str, config: FederatedConfig):
        try:
            await self._update_job(job_id, "IN_PROGRESS", "PARTITIONING_DATA")
            
            # 1. Partition Data
            partitions = partition_service.partition_dataset(
                config.datasetId, 
                config.totalClients, 
                strategy=config.partitionStrategy, 
                seed=config.randomSeed
            )
            
            # Determine global classes
            dataset = await ml_repository.get_dataset(config.datasetId)
            target_col = dataset.labelColumn
            # To get accurate classes, we can check the dataset stats or read the test set
            test_path = os.path.join(os.getcwd(), "data", "processed", f"{config.datasetId}_test.csv")
            test_df = pd.read_csv(test_path)
            actual_target_col = None
            for col in test_df.columns:
                if "Label" in col or "Label_normalized" in col:
                    actual_target_col = col
            classes = test_df[actual_target_col].unique()
            classes.sort()
            
            # Register Clients in DB
            await federated_repository.clear_clients()
            for i, p_path in enumerate(partitions):
                c_id = f"client-{i+1}"
                part_df = pd.read_csv(p_path)
                fc = FederatedClient(
                    clientId=c_id,
                    clientName=f"Edge Node {i+1}",
                    status="IDLE",
                    localDatasetId=p_path,
                    sampleCount=len(part_df)
                )
                await federated_repository.save_client(fc)

            # 2. Setup Flower Strategy
            await self._update_job(job_id, "IN_PROGRESS", "STARTING_FLOWER_SERVER")
            
            # Initial parameters (all zeros)
            n_features = test_df.drop(columns=[actual_target_col]).shape[1]
            n_classes = len(classes)
            if n_classes == 2:
                initial_weights = [np.zeros((1, n_features)), np.zeros((1,))]
            else:
                initial_weights = [np.zeros((n_classes, n_features)), np.zeros((n_classes,))]
                
            initial_parameters = ndarrays_to_parameters(initial_weights)
            
            # Define round callback to save rounds to DB
            async def save_round_callback(server_round: int, parameters: List[np.ndarray], 
                                          num_clients: int, num_failures: int, agg_dur: float, metrics: dict):
                
                # Create round record
                r_id = f"{job_id}-round-{server_round}"
                fl_round = FederatedRound(
                    roundId=r_id,
                    jobId=job_id,
                    roundNumber=server_round,
                    globalModelVersion=f"fl-model-v1-round{server_round}",
                    participatingClients=num_clients,
                    droppedClients=num_failures,
                    aggregationDuration=agg_dur,
                    globalMetrics=metrics,
                    status="COMPLETED"
                )
                await federated_repository.save_round(fl_round)
                
                # Update job
                job = await federated_repository.get_job(job_id)
                job.currentRound = server_round
                job.latestMetrics = metrics
                job.latestGlobalModel = fl_round.globalModelVersion
                await federated_repository.save_job(job)
                
                # We save this federated model to the central ML model registry
                ml_model = MLModel(
                    modelId=r_id,
                    modelName=f"{config.modelName}-R{server_round}",
                    algorithm="SGDClassifier",
                    version=f"1.0.{server_round}",
                    datasetId=config.datasetId,
                    parameters={"loss": "log_loss", "penalty": "l2"},
                    artifactPath="", # will be updated below
                    status="VALIDATED",
                    trainingType="FEDERATED",
                    aggregationStrategy="FedAvg",
                    clientCount=num_clients,
                    trainingRounds=server_round,
                    metrics=metrics
                )
                
                # We need to construct the eval_model in order to save it
                from sklearn.linear_model import SGDClassifier
                eval_model = SGDClassifier(loss='log_loss', penalty='l2')
                eval_model.classes_ = classes
                if len(parameters) == 2:
                    eval_model.coef_ = parameters[0]
                    eval_model.intercept_ = parameters[1]
                
                # Fetch dummy feature schema and preprocessing from dataset (since it's not saved explicitly here)
                feature_schema = {"features": list(test_df.drop(columns=[actual_target_col]).columns)}
                preprocessing_schema = config.model_dump()
                
                # Save artifact
                artifact_path = model_artifact_service.save_artifact(eval_model, ml_model, feature_schema, preprocessing_schema)
                ml_model.artifactPath = artifact_path
                
                await ml_repository.save_model(ml_model)
                logger.info(f"Saved FL global model {r_id} to ML Registry at {artifact_path}.")

            strategy = TrustChainFedAvg(
                dataset_id=config.datasetId,
                classes=classes,
                round_callback=save_round_callback,
                fraction_fit=config.participationRate,
                fraction_evaluate=0.0, # We evaluate globally centrally
                min_fit_clients=config.minimumClients,
                min_available_clients=config.totalClients,
                initial_parameters=initial_parameters
            )

            # 3. Client Factory
            def client_fn(cid: str) -> fl.client.Client:
                c_idx = int(cid)
                # In simulation, cid is 0 to totalClients-1
                return TrustChainClient(
                    dataset_id=config.datasetId,
                    client_index=c_idx,
                    classes=classes,
                    config=config.model_dump()
                ).to_client()

            # 4. Start Simulation
            await self._update_job(job_id, "RUNNING", "FEDERATED_TRAINING")
            
            # Since start_simulation is synchronous and heavy, run it in a thread
            loop = asyncio.get_running_loop()
            
            def run_flower():
                fl.simulation.start_simulation(
                    client_fn=client_fn,
                    num_clients=config.totalClients,
                    config=fl.server.ServerConfig(num_rounds=config.trainingRounds),
                    strategy=strategy,
                    ray_init_args={"include_dashboard": False, "num_cpus": min(4, os.cpu_count() or 2)},
                )
                
            await loop.run_in_executor(None, run_flower)
            
            await self._update_job(job_id, "COMPLETED", "COMPLETED")
            logger.info(f"Federated Job {job_id} completed successfully.")
            
        except Exception as e:
            logger.error(f"Federated Job {job_id} failed: {e}")
            await self._update_job(job_id, "FAILED", "FAILED", str(e))

federated_training_service = FederatedTrainingService()

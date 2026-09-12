import logging
import os
import time
import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Optional, Callable
import flwr as fl
from flwr.common import Parameters, Scalar, NDArrays, FitRes, FitIns
from flwr.server.client_proxy import ClientProxy
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import log_loss, accuracy_score, precision_score, recall_score, f1_score

logger = logging.getLogger("trustchain.federated.strategy")

PROCESSED_DIR = os.path.join(os.getcwd(), "data", "processed")

class TrustChainFedAvg(fl.server.strategy.FedAvg):
    def __init__(
        self,
        dataset_id: str,
        classes: np.ndarray,
        round_callback: Callable = None,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.dataset_id = dataset_id
        self.classes = classes
        self.round_callback = round_callback
        
        # Load centralized test set for global evaluation
        test_path = os.path.join(PROCESSED_DIR, f"{dataset_id}_test.csv")
        if not os.path.exists(test_path):
            raise FileNotFoundError(f"Centralized test dataset {test_path} not found.")
            
        self.test_df = pd.read_csv(test_path)
        
        self.target_col = None
        for col in self.test_df.columns:
            if "Label" in col or "Label_normalized" in col:
                self.target_col = col
                
        if not self.target_col:
            raise ValueError("Label column not found in test data")
            
        self.X_test = self.test_df.drop(columns=[self.target_col])
        self.y_test = self.test_df[self.target_col]
        
        # We need a dummy model to evaluate parameters
        self.eval_model = SGDClassifier(loss='log_loss', penalty='l2')
        self.eval_model.classes_ = self.classes
        
        n_features = self.X_test.shape[1]
        n_classes = len(self.classes)
        if n_classes == 2:
            self.eval_model.coef_ = np.zeros((1, n_features))
            self.eval_model.intercept_ = np.zeros((1,))
        else:
            self.eval_model.coef_ = np.zeros((n_classes, n_features))
            self.eval_model.intercept_ = np.zeros((n_classes,))

    def set_model_parameters(self, parameters: List[np.ndarray]):
        if len(parameters) == 2:
            self.eval_model.coef_ = parameters[0]
            self.eval_model.intercept_ = parameters[1]

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[BaseException],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        start_time = time.time()
        
        # Call the parent FedAvg aggregation
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(server_round, results, failures)
        
        agg_duration = time.time() - start_time
        
        if aggregated_parameters is not None:
            # We have a new global model!
            # Evaluate it right away
            parameters_ndarrays = fl.common.parameters_to_ndarrays(aggregated_parameters)
            self.set_model_parameters(parameters_ndarrays)
            
            try:
                y_pred = self.eval_model.predict(self.X_test)
                # Compute metrics
                acc = float(accuracy_score(self.y_test, y_pred))
                mac_f1 = float(f1_score(self.y_test, y_pred, average='macro', zero_division=0))
                
                logger.info(f"Round {server_round} aggregation complete. Test Acc: {acc:.4f}, Macro F1: {mac_f1:.4f}")
                
                # Send callback to the training service to save this round's stats and model version
                if self.round_callback:
                    # Async callbacks can't be awaited here easily since flower runs sync.
                    # We will fire it via event loop
                    import asyncio
                    try:
                        loop = asyncio.get_running_loop()
                        loop.create_task(self.round_callback(
                            server_round, 
                            parameters_ndarrays, 
                            len(results), 
                            len(failures), 
                            agg_duration, 
                            {"accuracy": acc, "macroF1": mac_f1}
                        ))
                    except RuntimeError:
                        # If no running loop, we can't easily fire it. 
                        # This happens depending on how flower simulation is launched.
                        pass
                        
            except Exception as e:
                logger.error(f"Global evaluation error: {e}")
                
        return aggregated_parameters, aggregated_metrics

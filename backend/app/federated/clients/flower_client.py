import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
import flwr as fl
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import log_loss, accuracy_score, precision_score, recall_score, f1_score
from app.federated.services.partition_service import partition_service

logger = logging.getLogger("trustchain.federated.client")

def get_model_parameters(model: SGDClassifier) -> List[np.ndarray]:
    if hasattr(model, 'coef_') and hasattr(model, 'intercept_'):
        return [model.coef_, model.intercept_]
    return []

def set_model_parameters(model: SGDClassifier, parameters: List[np.ndarray]):
    if len(parameters) == 2:
        model.coef_ = parameters[0]
        model.intercept_ = parameters[1]
    return model

class TrustChainClient(fl.client.NumPyClient):
    def __init__(self, dataset_id: str, client_index: int, classes: np.ndarray, config: Dict[str, Any]):
        self.dataset_id = dataset_id
        self.client_index = client_index
        self.classes = classes
        self.config = config
        
        # Load local partition
        self.df = partition_service.get_partition(dataset_id, client_index)
        
        # Determine target col
        self.target_col = None
        for col in self.df.columns:
            if "Label" in col or "Label_normalized" in col:
                self.target_col = col
                
        if not self.target_col:
            raise ValueError("Label column not found in local partition")
            
        self.X = self.df.drop(columns=[self.target_col])
        self.y = self.df[self.target_col]
        
        # Initialize SGDClassifier (Logistic Regression for classification)
        self.model = SGDClassifier(
            loss='log_loss', 
            penalty='l2', 
            max_iter=self.config.get("localEpochs", 1), 
            tol=1e-3, 
            learning_rate='constant', 
            eta0=self.config.get("learningRate", 0.01),
            random_state=self.config.get("randomSeed", 42),
            warm_start=True
        )
        
        # Initialize classes manually so coef_ and intercept_ shapes are set
        # We run a partial_fit with empty data just to initialize the shapes
        # actually, partial_fit requires at least one sample per class to define classes_, 
        # or we just pass the classes explicitly
        # SGDClassifier can initialize if we pass classes explicitly
        # We can just partial_fit on a small dummy row for all classes to initialize weights, or let the server pass the initial weights.
        
        # Server will pass initial weights. We just need classes to be set.
        self.model.classes_ = np.array(classes)
        # Initialize shapes (n_classes, n_features)
        n_features = self.X.shape[1]
        n_classes = len(classes)
        if n_classes == 2:
            self.model.coef_ = np.zeros((1, n_features))
            self.model.intercept_ = np.zeros((1,))
        else:
            self.model.coef_ = np.zeros((n_classes, n_features))
            self.model.intercept_ = np.zeros((n_classes,))

    def get_parameters(self, config: Dict[str, str]) -> List[np.ndarray]:
        return get_model_parameters(self.model)

    def fit(self, parameters: List[np.ndarray], config: Dict[str, str]) -> Tuple[List[np.ndarray], int, Dict[str, Any]]:
        # Set parameters from server
        set_model_parameters(self.model, parameters)
        
        # Train
        try:
            # We use partial_fit to avoid resetting the model, though warm_start=True might suffice
            self.model.partial_fit(self.X, self.y, classes=self.classes)
        except Exception as e:
            logger.error(f"Client {self.client_index} training failed: {e}")
            raise e
            
        # Optional: calculate local metrics to return
        accuracy = 0.0
        try:
            accuracy = self.model.score(self.X, self.y)
        except Exception:
            pass
            
        # Return updated parameters, number of examples, and metrics
        return get_model_parameters(self.model), len(self.X), {"accuracy": float(accuracy)}

    def evaluate(self, parameters: List[np.ndarray], config: Dict[str, str]) -> Tuple[float, int, Dict[str, Any]]:
        set_model_parameters(self.model, parameters)
        
        # Evaluate locally
        try:
            y_pred = self.model.predict(self.X)
            # Log loss requires predict_proba
            loss = float(log_loss(self.y, self.model.predict_proba(self.X), labels=self.classes))
            accuracy = float(accuracy_score(self.y, y_pred))
            f1 = float(f1_score(self.y, y_pred, average='macro', zero_division=0))
        except Exception as e:
            logger.warning(f"Client {self.client_index} evaluation error: {e}")
            loss = 1.0
            accuracy = 0.0
            f1 = 0.0
            
        return loss, len(self.X), {"accuracy": accuracy, "f1": f1}

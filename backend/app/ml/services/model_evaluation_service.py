import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score
)

logger = logging.getLogger("trustchain.ml.evaluation_service")

class ModelEvaluationService:
    def evaluate(self, model: Any, X_test: pd.DataFrame, y_test: pd.Series, label_mapping: Dict[str, str]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Evaluate model and return (metrics, confusion_matrix_data)
        """
        try:
            # Predict
            y_pred = model.predict(X_test)
            
            # Inverse map labels for readable evaluation if they were encoded
            # Wait, the pipeline encoded categorical features but label was likely kept as string or integer?
            # In Sprint 4.1, Pipeline: target_col was string ('BENIGN', 'DDoS', etc) before splitting. 
            # So y_test and y_pred are already string classes.
            
            classes = sorted(list(set(y_test) | set(y_pred)))
            
            # Metrics
            acc = accuracy_score(y_test, y_pred)
            
            # Macro Averages
            precision_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
            recall_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
            f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
            
            # Weighted Averages
            precision_weighted = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall_weighted = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            
            # Per class metrics
            precision_per_class = precision_score(y_test, y_pred, average=None, labels=classes, zero_division=0)
            recall_per_class = recall_score(y_test, y_pred, average=None, labels=classes, zero_division=0)
            f1_per_class = f1_score(y_test, y_pred, average=None, labels=classes, zero_division=0)
            
            per_class_dict = {}
            for i, cls in enumerate(classes):
                # Count support from true labels
                support = int(np.sum(y_test == cls))
                per_class_dict[cls] = {
                    "precision": float(precision_per_class[i]),
                    "recall": float(recall_per_class[i]),
                    "f1": float(f1_per_class[i]),
                    "support": support
                }
                
            # AUC (Require predict_proba)
            roc_auc = None
            if hasattr(model, "predict_proba"):
                try:
                    y_proba = model.predict_proba(X_test)
                    if len(classes) == 2:
                        # binary
                        roc_auc = float(roc_auc_score(y_test, y_proba[:, 1]))
                    else:
                        # multi-class
                        roc_auc = float(roc_auc_score(y_test, y_proba, multi_class='ovr'))
                except Exception as e:
                    logger.warning(f"Could not calculate ROC-AUC: {e}")
            
            metrics = {
                "accuracy": float(acc),
                "precision": float(precision_macro),
                "recall": float(recall_macro),
                "f1Score": float(f1_macro),
                "macroF1": float(f1_macro),
                "weightedF1": float(f1_weighted),
                "rocAuc": roc_auc,
                "perClass": per_class_dict
            }
            
            # Confusion Matrix
            cm = confusion_matrix(y_test, y_pred, labels=classes)
            # Normalize over true rows
            row_sums = cm.sum(axis=1)[:, np.newaxis]
            # Avoid divide by zero
            row_sums[row_sums == 0] = 1
            cm_normalized = cm.astype('float') / row_sums
            
            cm_data = {
                "classes": classes,
                "raw_matrix": cm.tolist(),
                "normalized_matrix": cm_normalized.tolist()
            }
            
            return metrics, cm_data
            
        except Exception as e:
            logger.error(f"Error during model evaluation: {e}")
            raise e

model_evaluation_service = ModelEvaluationService()

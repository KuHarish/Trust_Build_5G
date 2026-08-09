import os
import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from app.ml.schemas.dataset import DatasetProcessRequest

logger = logging.getLogger("trustchain.ml.pipeline")

# Known dataset label mappings (CICIDS, CICDDoS, UNSW-NB15)
LABEL_MAPPING = {
    # CICIDS2017 & CICDDoS2019
    "BENIGN": "BENIGN",
    "Normal": "BENIGN",
    "DDoS": "DDoS",
    "DoS": "DDoS",
    "PortScan": "Other Attack",
    "Bot": "Other Attack",
    "Infiltration": "Insider",
    "Web Attack": "Data Manipulation",
    "Brute Force": "Spoofing",
    
    # UNSW-NB15
    "0": "BENIGN",
    "1": "Other Attack",
    "Fuzzers": "Other Attack",
    "Analysis": "Data Manipulation",
    "Backdoor": "Insider",
    "Exploits": "Data Manipulation",
    "Generic": "Other Attack",
    "Reconnaissance": "Other Attack",
    "Shellcode": "Insider",
    "Worms": "Insider",
}

class PreprocessingPipeline:
    def __init__(self, config: DatasetProcessRequest):
        self.config = config
        self.scaler = None
        self.label_encoder = LabelEncoder()
        self.feature_encoders = {}
        
        if self.config.scaleNumerical:
            if self.config.scalerType == "StandardScaler":
                self.scaler = StandardScaler()
            else:
                self.scaler = MinMaxScaler()

    def normalize_labels(self, df: pd.DataFrame, label_col: str) -> pd.DataFrame:
        if label_col not in df.columns:
            return df
            
        def map_label(val):
            val_str = str(val).strip()
            for key, mapped in LABEL_MAPPING.items():
                if key.lower() in val_str.lower():
                    return mapped
            return "UNKNOWN"
            
        df[f"{label_col}_normalized"] = df[label_col].apply(map_label)
        return df

    def process(self, df: pd.DataFrame, label_col: str = "Label") -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        initial_rows = len(df)
        
        # 1. Remove unusable columns
        cols_to_drop = [c for c in self.config.removeColumns if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # 2. Handle duplicates
        if self.config.removeDuplicates:
            df = df.drop_duplicates()
            
        # 3. Handle Infinite Values
        # Replace inf with nan so we can handle them in the missing step
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        
        # 4. Handle Missing
        if self.config.handleMissing == "drop":
            df = df.dropna()
        else:
            num_cols = df.select_dtypes(include=[np.number]).columns
            if self.config.handleMissing == "mean":
                df[num_cols] = df[num_cols].fillna(df[num_cols].mean())
            elif self.config.handleMissing == "median":
                df[num_cols] = df[num_cols].fillna(df[num_cols].median())
            # For categorical, fill with mode
            cat_cols = df.select_dtypes(exclude=[np.number]).columns
            for c in cat_cols:
                df[c] = df[c].fillna(df[c].mode()[0] if not df[c].mode().empty else "UNKNOWN")

        # 5. Label Normalization
        df = self.normalize_labels(df, label_col)
        target_col = f"{label_col}_normalized" if f"{label_col}_normalized" in df.columns else label_col

        # 6. Encode Categorical Features
        if self.config.encodeCategorical:
            cat_cols = df.select_dtypes(exclude=[np.number]).columns
            for c in cat_cols:
                if c not in [label_col, target_col]:
                    le = LabelEncoder()
                    df[c] = le.fit_transform(df[c].astype(str))
                    self.feature_encoders[c] = le

        # 7. Scale Numerical Features
        features = [c for c in df.columns if c not in [label_col, target_col]]
        if self.config.scaleNumerical and self.scaler is not None:
            num_cols = df[features].select_dtypes(include=[np.number]).columns
            if len(num_cols) > 0:
                df[num_cols] = self.scaler.fit_transform(df[num_cols])

        # 8. Train / Val / Test Split
        val_test_size = self.config.valSize + self.config.testSize
        if val_test_size >= 1.0:
            val_test_size = 0.3 # Fallback
            
        X = df[features]
        y = df[target_col] if target_col in df.columns else None

        if y is not None:
            # Check class distribution to avoid stratify errors on very rare classes
            class_counts = y.value_counts()
            valid_classes = class_counts[class_counts > 1].index
            
            # Keep only rows with valid classes for stratification if needed, 
            # but to avoid dropping data, we might just turn off stratify if there's an issue.
            try:
                X_train, X_temp, y_train, y_temp = train_test_split(
                    X, y, test_size=val_test_size, random_state=self.config.randomSeed, stratify=y
                )
            except ValueError:
                # Fallback without stratification
                X_train, X_temp, y_train, y_temp = train_test_split(
                    X, y, test_size=val_test_size, random_state=self.config.randomSeed
                )
                
            test_ratio = self.config.testSize / val_test_size
            try:
                X_val, X_test, y_val, y_test = train_test_split(
                    X_temp, y_temp, test_size=test_ratio, random_state=self.config.randomSeed, stratify=y_temp
                )
            except ValueError:
                X_val, X_test, y_val, y_test = train_test_split(
                    X_temp, y_temp, test_size=test_ratio, random_state=self.config.randomSeed
                )
                
            train_df = pd.concat([X_train, y_train], axis=1)
            val_df = pd.concat([X_val, y_val], axis=1)
            test_df = pd.concat([X_test, y_test], axis=1)
        else:
            X_train, X_temp = train_test_split(X, test_size=val_test_size, random_state=self.config.randomSeed)
            test_ratio = self.config.testSize / val_test_size
            X_val, X_test = train_test_split(X_temp, test_size=test_ratio, random_state=self.config.randomSeed)
            train_df, val_df, test_df = X_train, X_val, X_test

        stats = {
            "totalSamples": len(df),
            "features": len(features),
            "classes": len(y.unique()) if y is not None else 0,
            "classDistribution": y.value_counts().to_dict() if y is not None else {},
            "trainingSamples": len(train_df),
            "validationSamples": len(val_df),
            "testingSamples": len(test_df),
            "missingValues": 0, # Since we handled them
            "duplicateRows": initial_rows - len(df)
        }
        
        return train_df, val_df, test_df, stats

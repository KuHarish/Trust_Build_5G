import os
import pandas as pd
import numpy as np
import logging
from typing import List, Tuple

logger = logging.getLogger("trustchain.federated.partition")

PROCESSED_DIR = os.path.join(os.getcwd(), "data", "processed")
PARTITIONS_DIR = os.path.join(os.getcwd(), "data", "federated_partitions")
os.makedirs(PARTITIONS_DIR, exist_ok=True)

class PartitionService:
    def partition_dataset(self, dataset_id: str, num_clients: int, strategy: str = "NON_IID", seed: int = 42) -> List[str]:
        """
        Partitions the training dataset into `num_clients` local client datasets.
        Returns a list of file paths to the partitions.
        """
        train_path = os.path.join(PROCESSED_DIR, f"{dataset_id}_train.csv")
        test_path = os.path.join(PROCESSED_DIR, f"{dataset_id}_test.csv")
        
        # Auto-generate synthetic dataset for simulation if missing
        if not os.path.exists(train_path) or not os.path.exists(test_path):
            os.makedirs(PROCESSED_DIR, exist_ok=True)
            logger.info(f"Synthetic {dataset_id} generation started...")
            
            # Generate 500 rows for train, 100 for test
            np.random.seed(seed)
            features = ['avgLatency', 'avgBandwidth', 'avgSignalStrength', 'avgJitter', 'transmissionSuccessRate', 'avgPacketSize']
            
            def make_synthetic(n_rows):
                df = pd.DataFrame(np.random.rand(n_rows, len(features)), columns=features)
                # Ensure binary labels (0 or 1)
                df['Label'] = np.random.randint(0, 2, size=n_rows)
                return df
                
            train_df = make_synthetic(500)
            test_df = make_synthetic(100)
            
            train_df.to_csv(train_path, index=False)
            test_df.to_csv(test_path, index=False)
            logger.info(f"Synthetic {dataset_id} datasets created at {PROCESSED_DIR}")

        df = pd.read_csv(train_path)
        np.random.seed(seed)
        
        # Determine target column
        target_col = None
        for col in df.columns:
            if "Label" in col or "Label_normalized" in col:
                target_col = col
                
        if not target_col:
            raise ValueError("Label column not found in training data")

        # Shuffle first to randomize any implicit ordering
        df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

        partitions = []
        if strategy.upper() == "IID":
            # Simple uniform random split
            chunk_size = len(df) // num_clients
            chunks = [df.iloc[i:i+chunk_size] for i in range(0, len(df), chunk_size)]
            if len(chunks) > num_clients:
                # Merge the last chunk with the second to last if there's a remainder
                last_chunk = chunks.pop()
                chunks[-1] = pd.concat([chunks[-1], last_chunk])
            partitions = chunks
        else:
            # NON_IID: Sort by label, then split. This creates label skew among clients.
            df_sorted = df.sort_values(by=target_col).reset_index(drop=True)
            chunk_size = len(df_sorted) // num_clients
            chunks = [df_sorted.iloc[i:i+chunk_size] for i in range(0, len(df_sorted), chunk_size)]
            if len(chunks) > num_clients:
                last_chunk = chunks.pop()
                chunks[-1] = pd.concat([chunks[-1], last_chunk])
            # Shuffle each chunk so local training isn't completely ordered
            partitions = [chunk.sample(frac=1, random_state=seed).reset_index(drop=True) for chunk in chunks]

        # Save partitions
        partition_paths = []
        for i, part_df in enumerate(partitions):
            if isinstance(part_df, np.ndarray):
                part_df = pd.DataFrame(part_df, columns=df.columns)
            path = os.path.join(PARTITIONS_DIR, f"{dataset_id}_client_{i}.csv")
            part_df.to_csv(path, index=False)
            partition_paths.append(path)
            
        logger.info(f"Partitioned dataset {dataset_id} into {num_clients} {strategy} partitions.")
        return partition_paths
        
    def get_partition(self, dataset_id: str, client_index: int) -> pd.DataFrame:
        path = os.path.join(PARTITIONS_DIR, f"{dataset_id}_client_{client_index}.csv")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Client partition {path} not found.")
        return pd.read_csv(path)

partition_service = PartitionService()

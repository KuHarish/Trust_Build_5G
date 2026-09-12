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
        if not os.path.exists(train_path):
            raise FileNotFoundError(f"Training dataset {train_path} not found.")

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
            chunks = np.array_split(df, num_clients)
            partitions = chunks
        else:
            # NON_IID: Sort by label, then split. This creates label skew among clients.
            df_sorted = df.sort_values(by=target_col).reset_index(drop=True)
            chunks = np.array_split(df_sorted, num_clients)
            # Shuffle each chunk so local training isn't completely ordered
            partitions = [chunk.sample(frac=1, random_state=seed).reset_index(drop=True) for chunk in chunks]

        # Save partitions
        partition_paths = []
        for i, part_df in enumerate(partitions):
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

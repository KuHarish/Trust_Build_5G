# TrustChain-5G Auxiliary Backend Structure & Data Repositories

This file ensures version control retention of required architectural folders:
- `backend/docs/`: Architectural engineering specification documents and schema ERDs.
- `backend/scripts/`: Operational helper scripts (database seeding, mock traffic injectors, TLS cert generators).
- `backend/docker/`: Backend-specific container profiles, healthcheck probes, and deployment configurations.
- `backend/datasets/`: Benchmark PCAP captures, simulated 5G netflow dataframes, and training validation datasets.
- `backend/models/`: Exported PyTorch / TensorFlow machine learning model checkpoints (`.pt`, `.onnx`, `.h5`) and federated global weight parameters.

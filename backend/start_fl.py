import requests

url = "http://127.0.0.1:8000/api/v1/ml/federated/start"
payload = {
    "datasetId": "CICIDS2017",
    "modelName": "TrustChain_Federated_Model",
    "totalClients": 5,
    "minimumClients": 3,
    "trainingRounds": 4,
    "participationRate": 0.8,
    "partitionStrategy": "IID",
    "randomSeed": 42
}

try:
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)

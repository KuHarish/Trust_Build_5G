"""
TrustChain-5G Module 2: Edge Server & Feature Extraction - Mathematical & Proximity Utilities.
Provides coordinate distance calculations for realistic node clustering simulation and
Min-Max normalization algorithms for downstream AI and Trust Engine compatibility.
"""
import math
from typing import Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance in kilometers between two geographic GPS coordinates
    using the Haversine formula. Used by the Edge simulation engine to prefer nearby communicating nodes.
    """
    # Radius of Earth in kilometers
    R = 6371.0
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    distance_km = R * c
    return round(distance_km, 4)

def normalize_min_max(value: float, min_val: float, max_val: float, invert: bool = False) -> float:
    """
    Safely normalizes a numeric value into a floating-point interval between 0.0 and 1.0.
    If invert is True, lower input values result in higher normalized scores (e.g., lower latency is better).
    """
    if max_val == min_val:
        return 0.5
    
    clamped = max(min_val, min(max_val, value))
    norm = (clamped - min_val) / (max_val - min_val)
    
    if invert:
        norm = 1.0 - norm
        
    return round(norm, 4)

def compute_normalized_features(
    avg_latency: float,
    avg_bandwidth: float,
    avg_signal_strength: float,
    avg_jitter: float,
    success_rate: float,
    avg_packet_size: float
) -> Dict[str, float]:
    """
    Generates a unified dictionary of standardized features bounded between [0.0, 1.0].
    Designed explicitly for zero-friction ingestion by Module 3 (Trust) and Module 4 (AI/ML).
    """
    return {
        # Latency: normalized against standard 5ms to 100ms bounds
        "norm_latency": normalize_min_max(avg_latency, min_val=5.0, max_val=100.0),
        # Bandwidth: normalized against 20Mbps to 1000Mbps bounds
        "norm_bandwidth": normalize_min_max(avg_bandwidth, min_val=20.0, max_val=1000.0),
        # Signal: normalized against -100 dBm to -30 dBm bounds (-30 dBm maps to 1.0)
        "norm_signal": normalize_min_max(avg_signal_strength, min_val=-100.0, max_val=-30.0),
        # Jitter: normalized against 0.1ms to 10.0ms bounds
        "norm_jitter": normalize_min_max(avg_jitter, min_val=0.1, max_val=10.0),
        # Success Rate: naturally bounded between 0.0 and 1.0
        "norm_success_rate": round(max(0.0, min(1.0, success_rate)), 4),
        # Packet Size: normalized against 64 to 1500 bytes bounds
        "norm_packet_size": normalize_min_max(avg_packet_size, min_val=64.0, max_val=1500.0)
    }

def update_running_average(current_avg: float, current_count: int, new_val: float) -> float:
    """
    Efficiently computes a new rolling average without storing entire raw traffic histories in memory.
    """
    if current_count <= 0:
        return round(new_val, 4)
    new_avg = ((current_avg * current_count) + new_val) / (current_count + 1)
    return round(new_avg, 4)

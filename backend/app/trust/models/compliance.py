"""
TrustChain-5G Module 3: Adaptive Trust Evaluation Engine
Security Compliance MongoDB Domain Model
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class SecurityCompliance(BaseModel):
    """
    MongoDB persistence document schema for 'security_compliance' collection.
    Tracks authentication, firmware attestation, and configuration states of nodes.
    """
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    complianceId: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique compliance configuration record ID")
    nodeId: str = Field(..., description="UUID of the network node")
    
    firmwareVersion: str = Field(default="v1.0.0-5g", description="Currently running active firmware")
    authenticationStatus: str = Field(default="VERIFIED", description="State of PKI certificate or API token auth")
    authorizationStatus: str = Field(default="AUTHORIZED", description="Access control perimeter state")
    policyCompliance: str = Field(default="COMPLIANT", description="Adherence to 5G core network policies")
    configurationCompliance: str = Field(default="COMPLIANT", description="Integrity of baseline configuration")
    
    lastSecurityCheck: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last automated security audit timestamp")
    complianceStatus: str = Field(default="SECURE", description="Overall boolean or enum compliance outcome")
    complianceNotes: List[str] = Field(default_factory=list, description="Diagnostic array of security faults or warnings")

"""
TrustChain-5G Users Collection Domain Model.

Defines schemas for authentication roles (Administrator, Researcher, Viewer) and account credentials.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class UserRole(str, Enum):
    ADMINISTRATOR = "Administrator"
    RESEARCHER = "Researcher"
    VIEWER = "Viewer"


class UserModel(BaseModel):
    """
    MongoDB schema representation for documents in the 'Users' collection.
    """
    id: str = Field(..., alias="_id", description="Unique string identifier or BSON ObjectId string")
    email: str = Field(..., description="Primary enterprise user electronic mail address")
    username: str = Field(..., description="Unique display handle for dashboard")
    full_name: str = Field(..., description="User full legal or organizational name")
    role: UserRole = Field(default=UserRole.VIEWER, description="Assigned platform RBAC clearance level")
    department: Optional[str] = Field(default="Cybersecurity Defense & 5G Telemetry", description="Organizational division")
    avatar_url: Optional[str] = Field(default=None, description="URL path to user profile image asset")
    is_active: bool = Field(default=True, description="Whether account login access is enabled")
    is_verified: bool = Field(default=False, description="Email verification state")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of account registration")
    last_login: Optional[datetime] = Field(default=None, description="Timestamp of most recent authenticated session")

    class Config:
        populate_by_name = True
        from_attributes = True


class UserInDB(UserModel):
    """
    Internal extension of UserModel including bcrypt cryptographic password hash.
    Never exposed directly through API responses.
    """
    hashed_password: str = Field(..., description="Bcrypt encrypted secret passphrase")
    password_reset_token: Optional[str] = Field(default=None, description="One-time secret verification code for recovery")
    password_reset_expires: Optional[datetime] = Field(default=None, description="Expiration time for recovery token")

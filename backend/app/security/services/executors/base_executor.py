from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from app.security.models.mitigation_action import MitigationAction

class BaseExecutor(ABC):
    """
    Abstract base class for all Mitigation Executors.
    """
    
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def execute(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Execute the mitigation action.
        Returns (success, new_state, result_message).
        If success is False, result_message contains the error.
        """
        pass

    @abstractmethod
    async def rollback(self, action: MitigationAction, current_node_state: Dict[str, Any]) -> Tuple[bool, str, Optional[str]]:
        """
        Rollback the mitigation action.
        Returns (success, new_state, result_message).
        """
        pass

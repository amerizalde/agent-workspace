# Node Protocol - Defines the Node interface

from typing import Protocol, Any, Dict, Optional

class Node(Protocol):
    """
    Pocket Flow Node Protocol.
    
    Each node follows the lifecycle:
        prep → exec → post
    """
    
    def prep(self, shared: Dict) -> Dict:
        """Prepare: gather/retrieve data from shared state."""
        ...
    
    def exec(self, prepared: Dict) -> Any:
        """Execute: perform logic and return result."""
        ...
    
    def post(self, shared: Dict, prepared: Dict, result: Any) -> str:
        """Post: return next action or 'exit'."""
        ...
    
    @property
    def name(self) -> str:
        """Get node class name or identifier."""
        ...

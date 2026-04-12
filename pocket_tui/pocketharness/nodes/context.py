# Context Node - Gather and prepare context

from typing import Dict

class ContextNode:
    """Context node for gathering and preparing data."""
    
    def __init__(self):
        self.name = "Context Node"
    
    def prep(self, shared: Dict) -> Dict:
        """Prepare: read task, context, state, etc."""
        return {
            "task": shared.get("task", ""),
            "context": shared.get("context", []),
            "history": shared.get("history", []),
            "state": shared.get("state", {}),
            "running": shared.get("running", False)
        }
    
    def exec(self, prepared: Dict) -> str:
        """Execute: return action for execution phase."""
        return "review_and_proceed"
    
    def post(self, shared: Dict, prepared: Dict, exec_result: str) -> str:
        """Post: update shared, write to history, return action."""
        shared["state"]["current_node"] = "Context"
        return exec_result

# Reflection Node - Evaluates result and decides continue/exit

from typing import Dict

class ReflectionNode:
    """Reflection node - evaluates progress and decides next action."""
    
    def __init__(self):
        self.name = "Reflection Node"
    
    def prep(self, shared: Dict) -> Dict:
        """Prepare: gather state for reflection."""
        return {
            "state": shared.get("state", {}),
            "history": shared.get("history", []),
            "last_result": shared.get("state", {}).get("last_result"),
            "skills": shared.get("skills", {}),
            "running": shared.get("running", False)
        }
    
    def exec(self, prepared: Dict) -> str:
        """Execute: decide continue or exit."""
        result = prepared.get("last_result", {})
        
        if not result or isinstance(result, str):
            return "review_and_proceed"
        
        next_action = result.get("next", "review_and_proceed")
        
        # Check for exit condition
        if "exit" in next_action.lower() and next_action != "stop":
            return "exit"
        
        return next_action
    
    def post(self, shared: Dict, prepared: Dict, action: str) -> str:
        """Post: update shared, return action."""
        shared["state"]["current_node"] = "Reflection"
        return action

# Decision Node - Agent brain, chooses actions

from typing import Dict

class DecisionNode:
    """Decision node for agent brain - chooses next action."""
    
    def __init__(self):
        self.name = "Decision Node"
    
    def prep(self, shared: Dict) -> Dict:
        """Prepare: gather state for decision."""
        return {
            "state": shared.get("state", {}),
            "history": shared.get("history", []),
            "current_node": shared.get("state", {}).get("current_node", "N/A"),
            "context": shared.get("context", []),
            "skills": shared.get("skills", {}),
            "running": shared.get("running", False)
        }
    
    def exec(self, prepared: Dict) -> str:
        """Execute: choose action based on state."""
        if shared.get("error_state"):
            return "inspect_shared"
        return "review_and_proceed"
    
    def post(self, shared: Dict, prepared: Dict, exec_result: str) -> str:
        """Post: update shared, write to history, return action."""
        shared["state"]["current_node"] = "Decision"
        shared["state"]["current_action"] = exec_result
        return exec_result

# Pocket Flow System
# Core Flow orchestration

from typing import List, Any, Dict
from pocketharness.shared_store import get_shared

class Flow:
    """
    Base Flow class - orchestrates a sequence of nodes.
    
    Typical flows:
        - Harness Flow: Input → Agent → Output
        - Agent Flow: Context → Decision → Execute → Reflect
        
    A Flow is a graph of nodes with shared state.
    """
    
    def __init__(self, name: str, nodes: List = None, shared_store: Dict = None):
        self.name = name
        self.nodes = nodes or []
        self._shared = shared_store or get_shared()
    
    @property
    def shared(self):
        """Get shared store reference."""
        return self._shared
    
    def register_node(self, node: "Node") -> "Flow":
        """Register a node to this flow."""
        self.nodes.append(node)
        return self
    
    def prep_all(self):
        """Prepare all node entry."""
        entry = {}
        for node in self.nodes:
            if hasattr(node, "prep"):
                entry["prepared"] = node.prep(self._shared)
        return entry
    
    def run(self):
        """Run the flow."""
        self._shared["running"] = True
        return self._execute_sequence(entry={}, index=0)
    
    def _execute_sequence(self, entry: Dict, index: int = 0):
        """Execute nodes in sequence."""
        if index >= len(self.nodes):
            return {"exit": True}
        
        node = self.nodes[index]
        
        if hasattr(node, "prep"):
            entry["prepared"] = node.prep(self._shared)
        
        if hasattr(node, "exec"):
            action = node.exec(entry)
            entry["action"] = action
            
            if isinstance(action, dict):
                next_action = action.get("next", action.get("exit", "exit"))
                if next_action == "exit":
                    return action
            
            # Continue if not exiting
            if next_action != "exit":
                return self._execute_sequence(entry, index + 1)
        
        # Default: skip if no execution
        return self._execute_sequence(entry, index + 1)
    
    def run_with_task(self, task: str = None):
        """Run flow with task context."""
        if task and task.strip():
            self._shared["task"] = task
        
        result = self.run()
        
        self._shared["running"] = False
        self._shared["task"] = None
        
        return result

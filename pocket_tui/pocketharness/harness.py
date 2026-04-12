# Harness Flow - Top-level orchestration

from typing import List
from pocketharness.flow import Flow
from pocketharness.nodes.context import ContextNode
from pocketharness.nodes.decision import DecisionNode
from pocketharness.nodes.execution import ExecutionNode
from pocketharness.nodes.reflection import ReflectionNode
from pocketharness.shared_store import get_shared, set_task, add_history

class HarnessFlow(Flow):
    """
    Top-level orchestration flow.
    
    Flow: Input → Agent Execution → Output
    
    Responsibilities:
        - Initialize shared state
        - Inject task input
        - Start agent execution (Decision Loop)
        - Return final output
    """
    
    def __init__(self, tasks: List = None):
        shared = get_shared()
        
        # Build node list (agent loop)
        self._agent_nodes = [
            ContextNode(),
            DecisionNode(),
            ExecutionNode(),
            ReflectionNode()
        ]
        super().__init__(name="harness", nodes=self._agent_nodes, shared_store=shared)
        self.tasks = tasks or []
    
    def prep_phase(self):
        """Prepare all nodes for execution."""
        entry = {}
        for node in self._agent_nodes:
            if hasattr(node, "prep"):
                entry["prepared"] = node.prep(self._shared)
        return entry
    
    def run(self, task: str = None) -> Dict:
        """Run the harness flow."""
        shared = self._shared
        
        # Initialize shared state
        if not shared.get("running"):
            set_task(task)
            shared["tasks"] = self.tasks or []
        
        for t in self.tasks or shared.get("tasks", []):
            if t == task:
                set_task(task)
        
        # Initialize state
        if not shared["state"].get("current_node"):
            shared["state"]["current_node"] = "Input"
            shared["state"]["current_action"] = "initial"
            shared["state"]["last_result"] = None
        
        # Run agent loop
        result = self._run_agent_loop()
        
        # Write final result to history
        add_history({
            "node": self.name,
            "action": "run",
            "result": result
        })
        
        return result
    
    def _run_agent_loop(self) -> Dict:
        """Run the agent decision loop."""
        shared = self._shared
        action = None
        
        # Context: Prepare context  
        context_result = ContextNode().prep(shared)
        
        action = "review_and_proceed"  # Default to proceed
        
        # Decision: Choose action
        action = DecisionNode().exec(context_result)
        
        # Validate decision
        if action == "exit":
            return {
                "status": "stopped",
                "message": "Agent stopped at decision point",
                "exit": True
            }
        
        # Execute: Run selected action
        skill = shared["skills"].get(action, {})
        result = ExecutionNode().exec({
            "current_action": action,
            "current_skill": skill,
            "state": shared["state"],
            "shared": shared
        })
        
        # Update state
        current_node = shared["state"]["current_node"] or "Action"
        shared["state"]["current_node"] = current_node
        shared["state"]["current_action"] = action
        
        # Reflection: Decide what to do next
        reflection_result = ReflectionNode().exec({
            "last_result": result,
            "shared": shared
        })
        
        # Return final result
        return result
    
    def run_single_task(self, task: str) -> Dict:
        """Run harness for a single task."""
        self._shared["task"] = task
        self._shared["running"] = True
        
        result = self.run(task=task)
        
        self._shared["running"] = False
        self._shared["task"] = None
        
        return result

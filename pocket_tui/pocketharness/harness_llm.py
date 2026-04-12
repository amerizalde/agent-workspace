# Harness with LLM Integration
# Modified harness that uses LLM for agent reasoning

from typing import List, Dict
from pocketharness.flow import Flow, Node
from pocketharness.nodes.context import ContextNode
from pocketharness.nodes.decision import DecisionNode
from pocketharness.nodes.execution import ExecutionNode
from pocketharness.nodes.reflection import ReflectionNode
from pocketharness.shared_store import get_shared, set_task, add_history
from pocketharness.skills import llm, llm_integration

class LLMHarnessFlow(Flow):
    """
    Harness Flow with LLM integration.
    
    Uses LLM for:
        - Task understanding and planning
        - Progress reflection
        - Next action decisions
        - Error recovery
    
    LLM calls are made in:
        1. DecisionNode (reasoning)
        2. ReflectionNode (progress reflection)
        3. LLMIntegrationSkill (LLM-based actions)
    """
    
    def __init__(self, tasks: List = None):
        shared = get_shared()
        
        self._agent_nodes = [
            ContextNode(),
            DecisionNode(),
            ExecutionNode(),
            ReflectionNode()
        ]
        
        super().__init__(name="harness", nodes=self._agent_nodes, shared_store=shared)
        self.tasks = tasks or []
        
        # Initialize LLM skills
        self.llm_skills = llm.LLMSkills()
        self.llm_integration = llm_integration.LLMIntegrationSkill()
    
    def run(self, task: str = None) -> Dict:
        """
        Run harness with LLM integration.
        
        LLM calls are made at:
        1. Decision phase - reason about task
        2. Execution phase - run skills
        3. Reflection phase - reflect on progress
        """
        shared = self._shared
        
        # Initialize shared
        if not shared.get("running"):
            set_task(task)
            shared["tasks"] = self.tasks or []
        
        # Initialize state
        if not shared["state"].get("current_node"):
            shared["state"]["current_node"] = "Input"
            shared["state"]["current_action"] = "initial"
            shared["state"]["last_result"] = None
        
        # Run agent loop
        result = self._run_agent_loop()
        
        # Log to history
        add_history({
            "node": self.name,
            "action": "run",
            "result": result
        })
        
        return result
    
    def _run_agent_loop(self) -> Dict:
        """Run agent loop with LLM calls."""
        shared = self._shared
        
        # Context: Gather context
        context_result = ContextNode().prep(shared)
        
        # Decision: Choose action (with optional LLM reasoning)
        action = DecisionNode().exec(context_result)
        
        # Optional: LLM reasoning for complex tasks
        should_reason = False
        task = shared.get("task", "")
        
        if task and shared["running"]:
            # Check if task seems complex (reasoning enabled)
            if len(task) > 20 and task.lower() not in ["exit", "quit", "stop"]:
                should_reason = True
        
        if should_reason:
            # Call LLM for reasoning
            reasoning = self.llm_skills.reason_task(task)
            shared["state"]["reasoning"] = reasoning.get("message", "")
        
        # Validate decision
        if action == "exit":
            return {
                "status": "stopped",
                "message": "Agent stopped",
                "exit": True
            }
        
        # Execute: Run selected skill
        skill = shared["skills"].get(action, {})
        
        if skill:
            # Prepare for execution with LLM context
            exec_prepared = {
                "current_action": action,
                "current_skill": skill,
                "state": shared["state"],
                "shared": shared
            }
        
        # Execute or call LLM integration
        if isinstance(skill, dict) and "llm" in str(skill.get("name", "")).lower():
            # Use LLM integration skill
            result = self.llm_integration.exec(exec_prepared)
        else:
            result = ExecutionNode().exec(exec_prepared if exec_prepared else {})
        
        # Reflection: Decide next
        reflection_result = ReflectionNode().exec({
            "last_result": result,
            "shared": shared,
            "history": shared.get("history", [])
        })
        
        return result
    
    def enable_llm(self, enabled: bool = True) -> None:
        """Enable/disable LLM integration."""
        self.llm_enabled = enabled
    
    def check_llm_enabled(self) -> bool:
        """Check if LLM is enabled and configured."""
        if hasattr(self, "llm_enabled"):
            return self.llm_enabled
        # Check environment
        import os
        return bool(os.getenv("POCKET_API_KEY")) or bool(os.getenv("POCKET_MODEL"))

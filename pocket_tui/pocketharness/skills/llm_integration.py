# LLM Integration Skill

from .llm import LLMSkills, call_llm, _mock_llm_response
from pocketharness.shared_store import get_shared

class LLMIntegrationSkill:
    """
    Integrate LLM intelligence into the agent loop.
    
    Usage:
        skill = LLMIntegrationSkill()
        result = skill.exec({
            "shared": shared,
            "current_action": action,
            "context": context
        })
    """
    
    def __init__(self):
        self.llm = LLMSkills()
        self.model = LLMConfig.MODEL
        self.api_key = LLMConfig.API_KEY
        self.url = LLMConfig.URL
    
    def exec(self, prepared: dict) -> dict:
        """
        Execute LLM integration.
        
        Args:
            prepared: {
                "shared": shared store,
                "current_action": action name,
                "context": context data
            }
        
        Returns:
            {"next": "review_and_proceed", "message": "LLM response", ...}
        """
        shared = prepared.get("shared")
        current_action = prepared.get("current_action")
        context = prepared.get("context", {})
        
        # Check if LLM is enabled
        if not self.llm or not self.llm.is_enabled:
            return {
                "next": current_action or "review_and_proceed",
                "message": "LLM not enabled, proceeding without it",
                "enabled": False
            }
        
        # Get task and history
        task = shared.get("task", "")
        history = shared.get("history", [])
        
        # Build prompt based on current action
        if current_action == "review_and_proceed":
            message = f"Continuing with task: {task}"
            next_action = "review_and_proceed"
        elif current_action.startswith("exit"):
            next_action = "exit"
            return {
                "next": "exit",
                "message": message,
                "enabled": True
            }
        else:
            next_action = "review_and_proceed"
        
        # Call LLM for feedback (optional)
        if len(history) > 0:
            try:
                reflection = self.llm.reflect_progress(task, history, shared["state"])
                message = reflection.get("message", "")
            except Exception as e:
                message = f"LLM reflection failed: {e}"
                next_action = "review_and_proceed"
        else:
            message = ""
        
        return {
            "next": next_action,
            "message": message or "No LLM feedback needed",
            "enabled": True
        }

if __name__ == "__main__":
    print("LLM Integration Skill")
    print(f"Model: {LLMConfig.MODEL}")
    print(f"Enabled: {LLMConfig.API_KEY or LLMConfig.MODEL}")

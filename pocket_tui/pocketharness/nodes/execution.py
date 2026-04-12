# Execution Node - Runs selected skills

from typing import Dict, Any

class ExecutionNode:
    """Execution node - runs selected action skill."""
    
    def __init__(self):
        self.name = "Execution Node"
    
    def prep(self, shared: Dict) -> Dict:
        """Prepare: read current action."""
        return {
            "shared": shared,
            "state": shared.get("state", {}),
            "current_action": shared.get("state", {}).get("current_action", "N/A"),
            "skills": shared.get("skills", {}),
            "context": shared.get("context", [])
        }
    
    def exec(self, prepared: Dict) -> Any:
        """Execute: run the selected skill."""
        skill_name = prepared.get("current_action")
        skills = prepared.get("skills", {})
        
        skill = skills.get(skill_name)
        
        if not skill:
            return {"next": skill_name, "message": f"Skipping unknown skill: {skill_name}"}
        
        # Execute skill
        result = skill.exec(prepared)
        
        if isinstance(result, dict) and result.get("next"):
            return result
        
        # If string result, treat as next action
        if isinstance(result, str):
            return {"next": result, "message": f"Result action: {result}"}
        
        return {"next": "review_and_proceed", "result": result}
    
    def post(self, shared: Dict, prepared: Dict, result: Any) -> str:
        """Post: write result to history."""
        shared.get("history", []).append({
            "node": "Execution",
            "action": prepared.get("current_action"),
            "result": result
        })
        return result.get("next", "review_and_proceed")

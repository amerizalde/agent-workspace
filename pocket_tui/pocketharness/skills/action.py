# Action Skills - Skills for continuing and stopping

from pocketharness.skills.base import Skill

class InspectShared(Skill):
    """Inspect shared store state."""
    
    def exec(self, prepared: dict) -> dict:
        """View shared store state."""
        shared = prepared.get("shared", {})
        return {
            "status": "success",
            "message": f"Task: {shared.get('task')}",
            "next": "review_and_proceed"
        }

class ReviewAndProceed(Skill):
    """Continue normal execution."""
    name = "review_and_proceed"
    
    def exec(self, prepared: dict) -> dict:
        """Continue execution."""
        return {
            "next": "review_and_proceed",
            "status": "continued"
        }

class ExitExecution(Skill):
    """Stop execution."""
    
    def exec(self, prepared: dict) -> dict:
        """Stop execution."""
        return {
            "next": "exit",
            "status": "stopped"
        }

class CreateSkill(Skill):
    """Create a new skill dynamically."""
    
    def exec(self, prepared: dict) -> dict:
        """Create new skill."""
        skill_name = prepared.get("skill_name")
        skill_desc = prepared.get("skill_desc")
        
        if skill_name and skill_desc:
            # Dynamic skill creation
            return {
                "next": "create_skill_created",
                "message": f"Created skill: {skill_name}"
            }
        
        return {
            "next": "error"
        }

class ReflectOnProgress(Skill):
    """Reflect on current progress."""
    
    def exec(self, prepared: dict) -> dict:
        """Reflect on state."""
        state = prepared.get("state", {})
        result = state.get("last_result", {})
        
        if result and not result.get("exit"):
            return {
                "next": "continue",
                "message": "Reflection complete"
            }
        
        return {
            "next": "review_and_proceed",
            "message": "Done working on task"
        }

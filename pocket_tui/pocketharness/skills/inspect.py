# Inspection Skills - Skills for inspection and observation

from pocketharness.skills.base import Skill

class PrintContext(Skill):
    """Print context items."""
    name = "print_context"
    description = "Print execution history"
    
    def exec(self, prepared: dict) -> dict:
        """Print context."""
        context = prepared.get("context", [])
        return {
            "next": "exit",
            "message": f"Context: {context}"
        }

class PrintHistory(Skill):
    """Print execution history."""
    name = "print_history"
    description = "Print execution history"
    
    def exec(self, prepared: dict) -> dict:
        """Print history."""
        history = prepared.get("history", [])
        return {
            "next": "review_and_proceed",
            "message": f"History: {history}"
        }

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

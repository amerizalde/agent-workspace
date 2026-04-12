# Error Handling Skills
# Skills for handling exceptions and edge cases

from pocketharness.skills.base import Skill

class HandleError(Skill):
    """Handle exceptions and errors."""
    
    def exec(self, prepared: dict) -> dict:
        """Handle error."""
        error = prepared.get("error", {})
        error_type = error.get("type", "unknown")
        
        return {
            "next": "error_handled",
            "message": f"Handled: {error_type}"
        }

class DefaultAction(Skill):
    """Default fallback action when no other skill matches."""
    
    def exec(self, prepared: dict) -> dict:
        """Return default continue action."""
        return {
            "next": "review_and_proceed"
        }

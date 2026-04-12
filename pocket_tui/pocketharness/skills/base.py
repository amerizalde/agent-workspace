# Skill Base Class

from typing import Dict, Any

class Skill:
    """Base Skill class for pocket_flow skills."""
    
    def __init__(self, name: str = None, description: str = None):
        self.name = name or __class__.__name__
        self.description = description or f"{self.name} Skill"
    
    def prepare(self, shared: Dict) -> Dict:
        """Prepare: read shared state for skill."""
        return {
            "shared": shared,
            "state": shared.get("state", {}),
            "context": shared.get("context", []),
            "history": shared.get("history", [])
        }
    
    def exec(self, prepared: Dict) -> Dict:
        """Execute: run skill logic."""
        raise NotImplementedError
    
    def post(self, prepared: Dict, result: Any) -> str:
        """Post: return next action."""
        return "continue"
    
    @classmethod
    def from_registry(cls, name: str):
        """Get skill from registry."""
        import pocketharness as pocket
        skill = getattr(pocket.skills, name, None)
        if skill:
            return skill()
        return cls(name=name, description=f"Skill: {name}")

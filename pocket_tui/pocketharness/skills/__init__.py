# Skills Package
# Skills registry and imports

from .base import Skill

# Import skills from all submodules
from . import action
from . import inspect
from . import error_handling
from . import inspect as inspection  # Alias
from . import llm
from . import llm_integration

# Export all skill classes and functions
__all__ = [
    "Skill",
    "action",
    "inspect",
    "error_handling",
    "llm",
    "llm_integration"
]

def get_all_skills():
    """
    Get registry of all available skills.
    
    Returns:
        Dict mapping skill names to skill classes
    """
    from inspect import getmembers
    
    import pocketharness.skills as skills_module
    
    skills = {}
    for name, member in getmembers(skills_module):
        if isinstance(member, type) and issubclass(member, Skill):
            skills[name] = member
    
    return skills

def get_default_skills():
    """
    Return default skills bundle.
    
    Includes:
        - review_and_proceed: Continue execution
        - exit: Stop execution
        - inspect_shared: View shared store
        - print_history: Print history
        - print_context: Print context
        - reflect_on_progress: Reflect on state
        - handle_error: Handle exceptions
        - llm_integrate: LLM integration
    """
    from . import action
    from . import inspect
    from . import error_handling
    from . import llm
    from . import llm_integration
    
    return {
        "review_and_proceed": action.ReviewAndProceed,
        "exit": action.Exit,
        "inspect_shared": inspect.InspectShared,
        "print_history": inspect.PrintHistory,
        "print_context": inspect.PrintContext,
        "reflect_on_progress": action.ReflectOnProgress,
        "handle_error": error_handling.HandleError,
        "llm_integrate": llm_integration.LLMIntegrationSkill
    }

if __name__ == "__main__":
    print("Skills Registry:")
    for name, skill in get_all_skills().items():
        print(f"  - {name}")

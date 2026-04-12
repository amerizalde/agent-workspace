# Demo Task for Pocket Flow TUI

"""
This is a demo task to showcase the Pocket Flow Agent Harness.

Usage:
    python -m pocketharness
    task 'demo_task'
    stop

The agent will:
1. Context: Gather task and context
2. Decision: Choose action (e.g., inspect_shared)
3. Execute: Run selected skill
4. Reflection: Decide whether to continue
...
"""

def demo_task():
    """Run the demo task."""
    shared = {
        "task": demo_task.__module__,
        "context": [
            {
                "id": 1,
                "type": "user",
                "message": "Hello! I want to inspect the agent."
            }
        ],
        "skills": {},
        "history": [],
        "state": {},
        "running": False
    }
    return shared

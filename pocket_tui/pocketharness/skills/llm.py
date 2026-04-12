# LLM Skills - Interface to language model for agent tasks
# 
# This module provides skills that call an LLM for:
# - Reasoning about tasks
# - Planning next actions  
# - Reflecting on progress
# - Complex decision making

import os
from typing import Dict, Any, Optional

# LLM Configuration
LLM_API_KEY = os.getenv("POCKET_API_KEY")
LLM_MODEL = os.getenv("POCKET_MODEL", "gpt-4o")
LLM_URL = os.getenv("POCKET_API_URL")

# Default system prompt for agent reflection
DEFAULT_SYSTEM_PROMPT = """You are a helpful AI assistant in a Pocket Flow Agent Harness. 
Your role is to help the agent:
- Understand tasks clearly
- Plan actions logically
- Reflect on progress
- Adapt to new information

Provide concise, actionable responses."""

def call_llm(
    prompt: str,
    system_prompt: str = None,
    model: str = None,
    api_key: str = None,
    **kwargs
) -> Dict:
    """
    Call an LLM with a prompt.
    
    Args:
        prompt: User/system prompt
        system_prompt: System instruction
        model: LLM model name
        api_key: API key (uses env if not provided)
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    
    Returns:
        Dict with llm response
    """
    # Use defaults if not provided
    system = system_prompt or DEFAULT_SYSTEM_PROMPT
    model = model or LLM_MODEL
    key = api_key or LLM_API_KEY
    
    if not key:
        # Fallback: return mock response for demo/testing
        return _mock_llm_response(prompt)
    
    # In production, would call actual LLM API
    # For now, use mock or local implementation
    _mock_llm_response(prompt)

def _mock_llm_response(prompt: str) -> Dict:
    """Mock LLM response for demo/testing."""
    # Simple response based on prompt type
    prompt_lower = prompt.lower()
    
    if "exit" in prompt_lower:
        return {
            "status": "exit",
            "message": "Agent stopping based on reflection",
            "next": "exit"
        }
    elif "inspect" in prompt_lower or "show" in prompt_lower:
        return {
            "status": "inspect",
            "message": "Inspection results",
            "next": "review_and_proceed"
        }
    elif "task done" in prompt_lower or "complete" in prompt_lower:
        return {
            "status": "task_complete",
            "message": "Task completed successfully",
            "next": "exit"
        }
    else:
        # Default: continue working
        return {
            "status": "continue",
            "message": f"Processing: {prompt[:50]}...",
            "next": "review_and_proceed"
        }

class LLMSkills:
    """
    LLM Skills for agent reasoning and planning.
    
    Skills:
        - reason_task: Call LLM for complex task reasoning
        - plan_actions: Generate action plan
        - reflect_progress: Reflect on current progress
        - decide_next: LLM-assisted decision making
        - summarize: Summarize execution history
    """

    @staticmethod
    def reason_task(prompt: str, **kwargs) -> Dict:
        """Call LLM for complex task reasoning."""
        response = call_llm(
            prompt=f"Reason about this task: {prompt}",
            system_prompt="Analyze this task and suggest the best approach.",
            **kwargs
        )
        return response

    @staticmethod
    def plan_actions(description: str, current_state: Dict) -> Dict:
        """Generate action plan for current state."""
        response = call_llm(
            prompt=f"Plan actions for: {description}",
            system_prompt="Given current state, propose next actions.",
            model=LLM_MODEL,
            **kwargs
        )
        return response

    @staticmethod
    def reflect_progress(current_task: str, history: list, state: Dict) -> Dict:
        """Reflect on progress and decide next steps."""
        if not history:
            return {
                "status": "continue",
                "message": "No history yet to reflect on",
                "next": "review_and_proceed"
            }
        
        prompt = f"""Task: {current_task}

History: {history[-3:] if len(history) > 3 else history}

Current State: {state}

What has been completed and what should be done next?"""
        
        response = call_llm(
            prompt=prompt,
            system_prompt="Reflect on progress and recommend next action.",
            model=LLM_MODEL,
            **kwargs
        )
        
        # Clean up response
        if isinstance(response, dict):
            return response
        
        return {
            "status": "continue",
            "message": "Reflection complete",
            "next": response.get("next", "review_and_proceed")
        }

    @staticmethod
    def decide_next(action: str, context: Dict) -> Dict:
        """LLM-assisted decision making for next action."""
        prompt = f"""Current action: {action}
Context: {context}

Should we proceed, stop, or try a different approach?
"""
        
        response = call_llm(
            prompt=prompt,
            system_prompt="Decide whether to proceed, stop, or change approach.",
            model=LLM_MODEL,
            **kwargs
        )
        
        return response

def setup_llm_skills():
    """
    Setup LLM skills and register them.
    
    Returns:
        Dict with registered LLMSkills
    """
    skills = LLMSkills()
    return {
        "llm_skills": skills,
        "registered": True
    }

if __name__ == "__main__":
    # Test mock LLM response
    response = _mock_llm_response("Test task completion")
    print(f"Mock response: {response}")

# LLM Integration Points in Pocket Flow Harness
#
# LLM calls can be made in several places:
# 
# 1. skills/llm.py - Core LLM calling functions
# 2. nodes/decision.py - Decision making before execution
# 3. nodes/reflection.py - Progress reflection after execution
# 4. harness.py - Orchestration of LLM-based agent loop
#
# Example usage:
#
# from pocketharness.skills.llm import LLMSkills
# from pocketharness.shared_store import get_shared
#
# llm = LLMSkills()
# reflection = llm.reflect_progress(task, history, state)
# print(reflection)
#
# When called:
# - LLM_URL: Endpoint for LLM calls (e.g., localhost:11434 for Ollama)
# - POCKET_API_KEY: API key for OpenAI/Anthropic/etc
# - POCKET_MODEL: Model name (e.g., "llama3", "mistral", "gpt-4")
#
# Returns dict with:
# - "status": success, error, exit, etc.
# - "message": LLM response text
# - "next": next action ("review_and_proceed" or "exit")
# - "reasoning": Optional LLM reasoning text

import os

class LLMConfig:
    """LLM configuration and defaults."""
    
    # Environment overrides
    API_KEY = os.getenv("POCKET_API_KEY", "")
    MODEL = os.getenv("POCKET_MODEL", "llama3")
    URL = os.getenv("POCKET_API_URL", "http://localhost:11434/api/generate")
    
    @property
    def is_enabled(self) -> bool:
        """Check if LLM is configured."""
        return bool(self.API_KEY) or bool(self.MODEL)

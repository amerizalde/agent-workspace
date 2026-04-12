# Pocket Flow Agent Harness - LIFESTYLE Guide

## What Files Should You Keep Working On?

### Core Development Files (Edit These)

#### 1. **Skills Layer** ⭐ Most Important
```
pocketharness/skills/
├── base.py              # Base Skill protocol
├── action.py            # Action skills (review, exit, continue)
├── inspect.py           # Inspection skills
├── error_handling.py    # Error handling skills
├── llm.py               # LLM calling functions ⭐
└── llm_integration.py   # LLM integration ⭐
```

**What to edit here:**
- Add new skill by subclassing `Skill` from `base.py`
- Modify `exec()` methods to change behavior
- Add LLM parameters in `llm.py`

#### 2. **Nodes** ⬇️ Next in Line
```
pocketharness/nodes/
├── context.py           # Context gathering
├── decision.py         # Decision making ⭐
├── execution.py        # Skill execution
└── reflection.py       # Progress reflection ⭐
```

**What to edit here:**
- Modify `decisions.py` to change action selection logic
- Update `execution.py` to handle skill execution differently
- Adjust `reflection.py` for different reflection strategies

#### 3. **Shared Store**
```
pocketharness/shared_store.py
```

**What to edit here:**
- Add new state keys for custom data
- Modify logging behavior
- Extend history structure

### Configuration Files

#### 4. **Harness** ⬇️ Orchestrator
```
pocketharness/harness.py
```

**What to edit here:**
- Change node order in `_agent_nodes`
- Modify agent loop behavior
- Update shared store initialization

#### 5. **CLI Interface**
```
pocketharness/tui/cli.py
```

**What to edit here:**
- Add new commands
- Modify TUI styling
- Change help text

### Testing and Documentation

#### 6. **Tests**
```
pocketharness/tests/
├── test_nodes.py
└── test_skills.py
```

**What to edit here:**
- Add test cases for new nodes
- Validate new skill behavior

#### 7. **Documentation**
```
pocketharness/
├── README.md           # User documentation
└── RETROSPECTIVE.md    # Development notes
```

### Supporting Files (Don't Touch)

- `__main__.py` - Entry point (unless changing CLI)
- `pyproject.toml` - Build configuration
- `flow.py` - Flow base class
- `shared_store.py` - State management

## Workflow for Adding New Skills

1. **Create** new skill class in `skills/` directory
2. **Implement** `prepare()`, `exec()`, `post()` methods
3. **Register** skill in appropriate module's `__init__.py`
4. **Test** using harness commands
5. **Update** documentation

## Daily Development Routine

```bash
# 1. View current state
pocket --state

# 2. View history
pocket --history

# 3. View logs
pocket --logs

# 4. Make changes in skills/
vim pocketharness/skills/your_skill.py

# 5. Test with task
python -m pocketharness "test task"

# 6. Inspect
python -m pocketharness --inspect
```

## Where LLM Calls Are Made

### Primary Location:
- **File:** `pocketharness/skills/llm.py`
- **Functions:** `call_llm()`, `LLMSkills.reflect_progress()`
- **Environment:** `POCKET_API_KEY`, `POCKET_MODEL`

### Integration Points:
- **Decision Phase:** `decision_node` → optionally call LLM for reasoning
- **Execution Phase:** `LLMIntegrationSkill` → integrate LLM into execution
- **Reflection Phase:** `ReflectionNode` → call LLM for progress reflection

### Mock vs Real:
- **No API key:** Uses `_mock_llm_response()` - simulates LLM behavior
- **With API key:** Uses real LLM calls (configure in `llm.py`)

## Key Functions to Understand

```python
# Main skill protocol
class Skill:
    def prepare(self, shared):  # Gather prep data
        ...
    def exec(self, prepared):    # Execute skill logic
        ...
    def post(self, prepared, result) -> str:  # Return next action
        ...

# LLM calling function
from pocketharness.skills.llm import call_llm

response = call_llm(
    prompt="User question",
    system_prompt="You are an AI assistant",
    model="gpt-4o",
    temperature=0.7
)

# Returns dict like:
# {
#     "status": "success",
#     "message": "LLM response",
#     "next": "review_and_proceed"
# }
```

## Common Tasks

### Adding a New Action Skill

```python
# pocketharness/skills/your_action.py
from pocketharness.skills.base import Skill

class YourAction(Skill):
    def prepare(self, shared):
        # Gather data needed
        ...
    
    def exec(self, prepared):
        # Execute action
        ...
    
    def post(self, prepared, result):
        # Return next action
        return "review_and_proceed"  # or "exit"
```

### Adding LLM Reasoning

```python
# In DecisionNode or similar
from pocketharness.skills.llm import LLMSkills

llm_skills = LLMSkills()
next_action = llm_skills.decide_next(action, context)
```

### Handling Errors Gracefully

```python
# In error_handling.py
try:
    # Try action
except Exception as e:
    # Handle and suggest alternative
    return {
        "next": "review_and_proceed",
        "error": str(e)
    }
```

## Quick Fixes

```bash
# Show current shared state
pocket --state

# Clear context
pocket --clear-context

# View execution history
pocket --history

# Enable/disable LLM
POCKET_API_KEY="" pocket          # Disable (use mocks)
POCKET_API_KEY="your_key" pocket  # Enable real LLM
```

## Best Practices

✅ **Good:**
- Keep skills focused on single responsibility
- Return simple `next` action strings
- Handle errors in `exec()` or catch exceptions
- Use mock responses for testing

❌ **Avoid:**
- Complex state mutations in `post()`
- Skipping error handling
- Relying on shared store side effects
- Hard-coding skill names

## Next Steps After This Guide

1. **Explore:** Check files listed in README.md
2. **Edit:** Modify skills/ for new behavior
3. **Test:** Run harness with different tasks
4. **Extend:** Add new skills as needed
5. **Document:** Update relevant markdown files

Happy hacking! 🎉

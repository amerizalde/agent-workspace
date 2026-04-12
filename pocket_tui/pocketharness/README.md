# Pocket Flow Agent Harness

A minimal, extensible terminal-based agent system using Pocket Flow architecture (Nodes + Flows).

## Architecture

```
[TUI Layer]
    ↓
[Harness Flow]
    ↓
[Agent Flow]
    ↓
[Skill Execution Layer]
```

### Core Components

- **TUI Layer**: CLI interface for user interaction
- **Harness Flow**: Top-level orchestration (Input → Agent → Output)
- **Agent Flow**: Decision loop (Context → Decision → Execute → Reflect)
- **Skills**: Reusable nodes or sub-flows

## Quick Start

```bash
cd pocketharness
python -m pocketharness
```

## Available Commands

```
task <string>   - Submit a task to the agent
stop            - Stop execution  
quit            - Exit
help            - Show help
state           - Show state
history         - Show history
logs            - Show logs
skills          - List skills
clear           - Clear terminal
context         - Show context
```

## Skills

The agent system includes these built-in skills:

| Skill | Description |
|-------|-------------|
| inspect_shared | View shared store contents |
| review_and_proceed | Continue execution |
| create_skill | Dynamic skill creation |
| reflect_on_progress | Reflect on current state |
| exit | Stop the agent |
| error_handling | Handle exceptions |
| print_history | Show execution history |
| print_context | Show current context items |

## Node Lifecycle

Each node follows:

```python
class Node:
    def prep(self, shared) -> dict      # Prepare data
    def exec(self, prepared) -> any     # Execute logic
    def post(self, shared, prepared, result) -> str  # Post processing
```

## Skills Structure

```python
class Skill:
    """
    def prepare(self, shared) -> dict      # Prep data
    def exec(self, prepared) -> dict       # Execute skill
    def post(self, prepared, result) -> str  # Return next action
    """
```

## Installation

```bash
pip install -e .
```

## License

MIT License

#!/usr/bin/env python3
# Pocket Flow TUI - Command Line Interface

from pocketharness.harness import HarnessFlow
from pocketharness.shared_store import get_shared, get_logs, get_level_logs

VERSION = "0.1.0"

def print_welcome():
    """Print welcome banner and help."""
    print("=" * 60)
    print(f"╔══════════════════════════════════════════════╗")
    print(f"║     Pocket Flow Agent Harness v{VERSION:22}║")
    print("╚══════════════════════════════════════════════╝")
    print("=" * 60)

def print_shared_state():
    """Print current shared state."""
    shared = get_shared()
    state = shared.get("state", {})
    
    print("\n" + "=" * 50)
    print("  ┌─ Shared Store ──────────────────────────┐")
    print(f"  │ Running:    {'Yes' if shared['running'] else 'No'}")
    print(f"  │ Task:       {str(shared.get('task', 'N/A')):20}│")
    print(f"  │ Current:    {str(state.get('current_node', 'N/A')):20}│")
    print(f"  │ Action:     {str(state.get('current_action', 'N/A')):30}│")
    print(f"  ├─ Context:   {len(shared.get('context', [])):2} items")
    print(f"  │ Skills:     {len(shared.get('skills', {})):2}")
    print(f"  │ History:    {len(shared.get('history', [])):2} entries")
    print(f"  │ Logs:       {len(shared.get('logs', [])):2}")
    print(f"  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def print_logs():
    """Print recent logs."""
    logs = get_logs()
    
    if not logs:
        print("\nNo logs yet.\n")
        return
    
    print("\n" + "=" * 50)
    print("  ┌─ Logs ──────────────────────────────────┐")
    for log_entry in logs[-10:]:
        timestamp = log_entry.get("timestamp", "")[:19]
        level = log_entry.get("level", "info")
        msg = log_entry.get("message", "")
        print(f"  │ [{timestamp}] [{level:4}] {msg}")
    print("  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def print_history():
    """Print execution history."""
    history = get_shared().get("history", [])
    
    if not history:
        print("\nNo history yet.\n")
        return
    
    print("\n" + "=" * 50)
    print("  ┌─ Execution History ────────────────────┐")
    for i, entry in enumerate(history[-5:], len(history) - 5):
        node = entry.get("node", "N/A")
        action = entry.get("action", "")
        result = str(entry.get("result", ""))[:30]
        print(f"  │ {i}. [{node:8}] {action:15} → {result}")
    print("  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def clear_logs():
    """Clear logs."""
    import pocketharness.logs.logs as logs
    logs.reset_history()

def clear_context():
    """Clear context."""
    import pocketharness.shared_store as store
    store.clear_context()

def show_help():
    """Show help."""
    print("""
Pocket Flow Agent Harness

USAGE:
    pocket -h    Show this help
    pocket       Run agent loop (read task.txt or prompt)
    pocket --inspect    Run without TUI
    pocket --logs      Show recent logs
    pocket --context  Show current context
    pocket --history  Show execution history
    
HINTS:
    Edit task.txt and run 'pocket' to run the agent
    
COMMANDS:
    -h, --help        Show help
    (no args)         Run agent loop
""")

def main():
    """Main CLI entry point."""
    print_welcome()
    print_shared_state()
    print_history()
    print_logs()

if __name__ == "__main__":
    main()

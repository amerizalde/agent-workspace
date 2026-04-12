#!/usr/bin/env python3
# Pocket Flow TUI - Command Line Interface

import sys
from pocketharness.harness import HarnessFlow
from pocketharness.shared_store import get_shared, log, get_logs

VERSION = "0.1.0"

def print_welcome():
    """Print welcome banner and help."""
    print("=" * 60)
    print("╔═══════════════════════════════════════════════════════╗")
    print(f"║     Pocket Flow Agent Harness v{VERSION:20}║")
    print("║     Graph-based Execution System - Pocket Flow        ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print("=" * 60)

def clear_screen():
    """Clear terminal."""
    print("\033[H\033[J", end="")

def print_shared_state():
    """Print current shared state."""
    shared = get_shared()
    state = shared.get("state", {})
    
    print("\n" + "=" * 50)
    print("  ┌─ Shared Store ──────────────────────────┐")
    print(f"  │ Running:    {'Yes' if shared['running'] else 'No'}")
    print(f"  │ Task:       {shared.get('task') or 'None':24}│")
    print(f"  │ Current:    {state.get('current_node', 'N/A'):26}│")
    print(f"  │ Action:     {state.get('current_action', 'N/A'):26}│")
    print(f"  ├─────────────────────────────────────────┤")
    print(f"  │ Context:    {len(shared.get('context', [])):3} items")
    print(f"  │ Skills:     {len(shared.get('skills', {})):3}")
    print(f"  │ History:    {len(shared.get('history', [])):3} entries")
    print(f"  │ Logs:       {len(shared.get('logs', [])):3}")
    print("  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def print_logs():
    """Print logs."""
    logs = get_logs()
    
    if not logs:
        print("\nNo logs yet.\n")
        return
    
    print("\n" + "=" * 50)
    print("  ┌─ Logs ──────────────────────────────────┐")
    for log_entry in logs[:10]:
        timestamp = log_entry.get("timestamp", "")[:19]
        level_color = "  " if log_entry.get("level") == "info" else "  "  # Simplified
        print(f"  │ [{timestamp}] {log_entry.get('message', '')}")
    print("  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def print_history():
    """Print execution history."""
    history = get_shared().get("history", [])
    
    if not history:
        print("\nNo history yet.\n")
        return
    
    print("\n" + "=" * 50)
    print("  ┌─ Execution History ──────────────────────┐")
    for i, entry in enumerate(history[-5:], len(history) - 5):
        node = entry.get("node", "N/A")
        action = entry.get("action", "")
        result = str(entry.get("result", ""))[:40]
        print(f"  │ {i:2}. [{node:8}] {action:20} → {result}")
    print("  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def print_skills():
    """Print available skills."""
    skills = get_shared().get("skills", {})
    
    if not skills:
        print("\nNo skills registered.\n")
        return
    
    print("\n" + "=" * 50)
    print("  ┌─ Available Skills ────────────────────────┐")
    for i, (name, skill) in enumerate(skills.items(), 1):
        desc = getattr(skill, "description", name)
        print(f"  │ {i:2}. {name:15} - {desc:30} │")
    print("  └─────────────────────────────────────────┘")
    print("=" * 50 + "\n")

def main():
    """Main CLI entry point."""
    harness = HarnessFlow(tasks=["default"])
    
    # Print welcome
    print_welcome()
    print_shared_state()
    print_history()
    print_skills()
    
    log("System initialized", "info")
    
    while harness.shared["running"]:
        try:
            user_input = input("➤ ").strip()
            
            if not user_input:
                continue
            
            # Echo input
            print(f"\n➤ {user_input}")
            
            parts = user_input.split(maxsplit=1)
            command = parts[0].lower()
            args = parts[1] if len(parts) > 1 else ""
            
            if command == "quit":
                log("User quit command", "info")
                print("Goodbye!")
                harness.shared["running"] = False
                break
            
            elif command == "stop":
                log("User stop command", "info")
                harness.shared["running"] = False
                print("Execution stopped.")
            
            elif command == "help":
                print("""
Command Reference:
  task <string>   - Set/submit a task
  state            - Show current shared state
  history          - Show execution history
  logs             - Show recent logs
  skills           - List all available skills
  context          - Show current context
  clear            - Clear terminal
  quit             - Exit program
""")
            
            elif command == "state":
                print_shared_state()
                log("Command: state", "info")
            
            elif command == "history":
                print_history()
                log("Command: history", "info")
            
            elif command == "logs":
                print_logs()
                log("Command: logs", "info")
            
            elif command == "skills":
                print_skills()
                log("Command: skills", "info")
            
            elif command == "context":
                context = get_shared().get("context", [])
                for i, item in enumerate(context[-5:], 1):
                    print(f"  {i}. {item}")
                print()
            
            elif command == "clear":
                clear_screen()
            
            elif command == "task" and args:
                log(f"Task submitted: {args}", "info")
                harness.run(args)
                print(f"\nTask result: {harness.shared.get('state', {}).get('last_result')}\n")
            else:
                print(f"Unknown command: {command}\n")
             
        except KeyboardInterrupt:
            log("User interrupted execution", "warning")
            print("\nInterrupted.")
            harness.shared["running"] = False
        
        except Exception as e:
            log(f"Error: {e}", "error")
            print(f"Error: {e}\n")

if __name__ == "__main__":
    main()

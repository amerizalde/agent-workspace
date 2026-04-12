#!/usr/bin/env python3
# Main entry point

import pocketharness.harness as harness
from pocketharness.shared_store import set_task, get_shared, get_logs, reset_history
import argparse

VERSION = "0.1.0"

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Pocket Flow Agent Harness")
    parser.add_argument("-v", "--version", action="version", version=f"%(prog)s {VERSION}")
    parser.add_argument("-i", "--inspect", action="store_true", help="Inspect mode")
    parser.add_argument("--logs", action="store_true", help="Show logs")
    parser.add_argument("--context", action="store_true", help="Show context")
    parser.add_argument("--history", action="store_true", help="Show history")
    parser.add_argument("--clear-logs", action="store_true", help="Clear logs")
    parser.add_argument("--clear-context", action="store_true", help="Clear context")
    
    args = parser.parse_args()
    
    if args.version:
        print(f"Pocket Flow Agent Harness v{VERSION}")
        return
    
    shared = get_shared()
    
    # Handle arguments
    if args.clear_logs:
        reset_history()
        print("Cleared logs.")
        return
    
    if args.clear_context:
        shared["context"].clear()
        print("Cleared context.")
        return
    
    if args.logs or args.history:
        print("Shared State:")
        print(f"  Running: {shared.get('running')}")
        print(f"  Task: {shared.get('task', 'N/A')}")
        print(f"  Current Node: {shared.get('state', {}).get('current_node', 'N/A')}")
        return
    
    # Default: run harness
    hf = harness.HarnessFlow()
    task = None
    
    # Read task from argument or file
    import sys
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    
    if task:
        set_task(task)
        print(f"Task: {task}")
    
    # Run harness
    shared["running"] = True
    result = hf.run(task=task)
    
    print(f"Result: {result}")
    
    shared["running"] = False
    print("\nDone.")

if __name__ == "__main__":
    main()

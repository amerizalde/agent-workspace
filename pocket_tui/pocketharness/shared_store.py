# Shared Store Module
# Single source of truth for all data, state, and control

import datetime

_shared = {
    "task": None,
    "context": [],
    "skills": {},
    "agents": {},
    "history": [],
    "state": {
        "current_node": None,
        "current_action": None,
        "last_result": None
    },
    "running": False,
    "logs": []
}

def get_shared():
    """Get a reference to the shared store."""
    return _shared.copy()

def set_task(task: str):
    """Set the current task."""
    _shared["task"] = task

def set_running(state: bool):
    """Set running state."""
    _shared["running"] = state

def _get_state():
    """Get internal state."""
    return _shared["state"]

def _add_entry(key: str, value):
    """Add/Update key in shared."""
    if key not in _shared:
        _shared[key] = []
    _shared[key].append(value)

def add_history(entry: dict):
    """Append to history (append-only)."""
    entry["timestamp"] = datetime.datetime.now().isoformat()
    _shared["history"].append(entry)

def log(message: str, level: str = "info"):
    """Add log entry."""
    _shared["logs"].append({
        "timestamp": datetime.datetime.now().isoformat(),
        "level": level,
        "message": message
    })

def get_logs(level: str = None, count: int = 20):
    """Get recent logs."""
    logs = _shared.get("logs", [])
    if level:
        logs = [l for l in logs if l.get("level") == level]
    return logs[-count:]

def get_level_logs(level: str) -> list:
    """Get logs filtered by level."""
    return [l for l in _shared.get("logs", []) if l.get("level") == level]

def get_context(index: int = -1):
    """Get context item (optional)."""
    if index < 0:
        return _shared["context"].copy()
    return _shared["context"][index] if index < len(_shared["context"]) else None

def clear_context():
    """Clear context history."""
    _shared["context"].clear()

def reset_history():
    """Clear history logs."""
    _shared["history"].clear()
    _shared["logs"].clear()

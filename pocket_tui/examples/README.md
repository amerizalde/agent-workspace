# Heartbeat Monitor Examples

This directory contains example use cases for the **heartbeat pattern** — periodic monitoring agents that stay alive, watch for events, and react automatically.

## The Heartbeat Pattern

```
┌─────────────────────────────────────┐
│      Periodic Monitoring Agent      │
│                                     │
│  Poll Event ──┐               ┌─→ ──┘
│   │           │              │      │
│   └─ Process ─┴─────────────┘      ↓
│       React                         └─ Graceful Shutdown
│                                     After N cycles
└─────────────────────────────────────┘
```

### Why Use This Pattern

✅ **Stays alive**: Your agent keeps working while you're away
✅ **Detects events**: Finds new emails, failures, messages
✅ **Auto-react**: Takes action without manual intervention
✅ **Clean lifecycle**: Starts cleanly, shuts down gracefully
✅ **Configurable**: Adjust intervals and cycle counts

### Use Cases

| Use Case | What to Monitor | Typical Interval |
|----------|----------------|------------------|
| Email Triage | New incoming emails | 5-30 seconds |
| Health Checks | API endpoints, servers | 30-60 seconds |
| Slack Monitoring | Channel messages | 5-15 seconds |
| CI/CD Pipeline | Build status | 30-60 seconds |
| Database Alerts | Query errors, slow queries | 10-30 seconds |
| File System Monitor | New files, changes | 5-15 seconds |

## Examples

### 1. Email Monitor (`email_monitor.py`)

**Use Case**: Startup team email triage

**What it does**:
- Polls inbox for new emails
- Summarizes with LLM
- Suggests reply actions
- Tracks priority emails

**Key Features**:
```python
EMAIL_POLL_INTERVAL = 5  # seconds
MAX_CYCLES = 12  # ~2 minute maintenance window
PRIORITY_EMAIL_SOURCES = {"boss@company.com", "investor@vc.com"}
```

**Example Output**:
```
🚀 Starting email monitor
Polling every 5 seconds...

--- Email 1 ---
┌─ Email Summary ────┐
│ Subject: Board meeting prep
│ From: HIGH priority
│ Action: high
│ Reply needed: yes
└─────────────────────┘
```

### 2. Deployment Health Monitor (`deploy_health_monitor.py`)

**Use Case**: DevOps health checking

**What it does**:
- Polls health endpoints (API endpoints, databases)
- Detects failures (503, 500, timeouts)
- Alerts via Slack, PagerDuty
- Escalates critical failures

**Key Features**:
```python
endpoints = [
    "https://api.company.com/health",
    "https://auth.company.com/status",
    "https://database.company.com/ping"
]

def check_health_endpoint(endpoint):
    # Return True if healthy, False if failure
    return random.random() < 0.95

def alert_on_failure(endpoint, status):
    # Send Slack/PagerDuty alert
    print(f"🚨 ALERT: {endpoint}")
```

### 3. Slack Channel Monitor (`slack_bot_monitor.py`)

**Use Case**: Customer support auto-responder

**What it does**:
- Polls Slack Web API for new messages
- Categorizes questions (pricing, account, technical)
- Auto-replies with canned responses
- Escalates complex issues

**Key Features**:
```python
def categorize_message(message):
    text = message.get("text", "").lower()
    if any(term in text for term in ["price", "cost", "$"]):
        return "pricing"
    if any(term in text for term in ["login", "password"]):
        return "account"
    if any(term in text for term in ["error", "broken"]):
        return "technical_issue"
    return "general"

def get_canned_response(category):
    return responses[category]
```

**Example Output**:
```
--- Message 1 ---
  What's your pricing for a team of 10?
  Category: PRICING
  🤖 Auto-reply
  Response: Thanks for your interest! Our plans start...
```

## Running Examples

To run any example:

```bash
python examples/email_monitor.py
```

Or with custom cycles:

```bash
python examples/email_monitor.py --cycles=20
```

## Extending Your Own Monitors

### 1. Add New Event Type

Create a new flow for your event:

```python
def event_flow():
    def check_for_events():
        # Query your data source
        events = list_api.get_pending_events()
        return events
    
    def process_event(event):
        # Process and react
        return result
    
    def wait_node():
        time.sleep(POLL_INTERVAL)
    
    # Compose flow
    return event_flow

def main():
    max_cycles = 30  # 2.5 minutes
    flow = make_event_flow()
    
    while cycle < max_cycles:
        cycle += 1
        # Check and process
        results = flow.run()
```

### 2. Multiple Monitors

Run several monitors in parallel:

```python
async def dashboard():
    # Email monitor thread
    import threading
    email_monitor = threading.Thread(target=monitor_emails)
    email_monitor.start()
    
    # Health monitor thread
    health_monitor = threading.Thread(target=monitor_health)
    health_monitor.start()
    
    # Slack monitor thread
    slack_monitor = threading.Thread(target=monitor_slack)
    slack_monitor.start()
    
    # Wait for all to complete
    email_monitor.join()
    health_monitor.join()
    slack_monitor.join()

if __name__ == "__main__":
    dashboard()
```

### 3. State Persistence

Save state for graceful restarts:

```python
shared["state"] = {
    "emails_processed": count,
    "last_cycle": cycle,
    "processed_indexes": [1, 3, 5],
    "config": {
        "poll_interval": EMAIL_POLL_INTERVAL,
        "max_cycles": MAX_CYCLES
    }
}
```

## Common Patterns

### 1. Conditional Processing

```python
def check_email():
    import random
    if random.random() < 0.3:  # 30% chance of new email
        return [{"id": 1, "from": "boss", "subject": "Review this ASAP"}]
    return []

def process_if_needed(emails):
    if not emails:
        return {"status": "no_new_emails"}
    
    for email in emails:
        result = llm.summarize(email)
        action = await llm.suggest_action(result)
    
    return {"status": "processed", "actions": actions}
```

### 2. Graceful Shutdown

Use a cycle counter that stops cleanly:

```python
def heartbeat_main():
    cycle = 0
    max_cycles = 6
    
    while cycle < max_cycles:
        cycle += 1
        print(f"Heartbeat {cycle}")
        
        # Your monitoring logic here
        check_and_process()
        
        if cycle == max_cycles:
            print("✅ Monitor stopped after", max_cycles, "cycles")
            return {
                "status": "complete",
                "cycles": cycle,
                "processed": count
            }
```

## Next Steps

1. **Test examples**: Run them to verify they work
2. **Create your own**: Use patterns above for your use case
3. **Add persistence**: Save state for resilient monitoring
4. **Handle errors**: Add retries and logging for robustness
5. **Deploy**: Run in production environment

## License

These examples are free to use for learning and production deployments.

## Questions

See the main `.ralph/HEARTBEAT.md` task documentation for the complete implementation details.

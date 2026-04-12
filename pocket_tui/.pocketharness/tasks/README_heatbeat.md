# Heartbeat Monitor Task

This is a periodic monitoring agent that stays alive and polls for new work.

## Task Location

- File: `.pocketharness/tasks/heartbeat.py`
- Task name: `heartbeat`

## Quick Start

```bash
python -m pocketharness
  task 'heartbeat'
  stop
```

## Architecture

The task implements the "nested flows" pattern:

```
┌─────────────────────────────────┐
│     Heartbeat Loop (WaitNode)   │
│     ┌──────────┬──────────────┐ │
│     │  Wait    │ EmailFlow    │ │
│     │  Node    │    ┌──────┐  │ │
│     └──────────└───→│Check ├─┘ │ │
│                     └──────┘   │ │
│                     →│Process │   │
│                     └────────┘   │ │
└─────────────────────────────────┘
```

## Features

- Polls every 2 seconds
- Processes emails when found
- Summarizes with LLM (simulated for harness)
- Graceful shutdown after N cycles
- Clean output with emoji indicators

## Email Types

The task processes these email types:

1. **Q3 Numbers Request** - Boss requests quarterly financial breakdown
2. **Server Maintenance Alert** - IT notifications about scheduled maintenance
3. **Benefits Enrollment** - HR announcements about open enrollment

## Output Example

```
🚀 Starting Heartbeat Email Monitor
   Polling every 2 seconds for 4 cycles...

--- 💓 Heartbeat 1 ---
  📭 No new emails.

--- 💓 Heartbeat 2 ---
  📬 1 new email(s)!
  💡 Q3 Numbers Request: Hey team, I need the Q3 revenue...
     Reply action: Reply if needs response, archive otherwise.
```

## State Management

The task maintains state in `shared["state"]`:

- `cycle`: Current heartbeat cycle (0-indexed)
- `max_cycles`: Maximum cycles before shutdown
- `email_count`: Current unread emails
- `emails_processed`: Total emails processed
- `emails_processed_indices`: List of processed email IDs

## Extending the Task

To add new email types:

1. Add to `SAMPLE_EMAILS` list
2. Call `simulate_new_email()` to add them
3. They'll automatically be processed

To change polling interval, modify the `wait_node()` function.

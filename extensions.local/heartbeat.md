# Heartbeat Agent Extension Design

## Goal
Run a supervised heartbeat loop inside the extension host so the agent can observe the current session and queue one bounded maintenance objective without waiting for a user prompt.

## Runtime Contract
1. The extension owns scheduling, persistence, pause/resume, and UI status.
2. The heartbeat loop never performs open-ended work. Each cycle selects exactly one action from a small registry.
3. The loop defaults to dry-run. Edit-capable behavior must be explicitly enabled.
4. Every cycle appends structured history with timestamp, trigger, action, and outcome.
5. Repeated failures increase backoff and can automatically disable the loop.
6. Edit-capable cycles can be approval-gated so implementation handoff is blocked until operator approval.

## State Model
- enabled: whether scheduling is active
- paused: whether timers are suspended while state remains enabled
- dryRun: whether maintenance cycles can only observe and summarize
- editEnabled: whether maintenance cycles may request implementation handoff
- requireApproval: whether edit-capable objectives must be explicitly approved before dispatch
- intervalSeconds: base delay between cycles
- cycle: monotonically increasing cycle counter
- lastRunAt: ISO timestamp for the last completed or failed cycle
- lastAction: idle, summarize, maintenance-pass, or awaiting-approval
- lastOutcome: short human-readable cycle result
- focusPrompt: operator-provided maintenance goal
- recentIssueFingerprint: idempotency marker for duplicate maintenance signals
- lastSignalFingerprint: most recent typed signal fingerprint
- signalCacheTtlSeconds: cache lifetime for typed signal snapshots
- approvalTimeoutSeconds: expiration window for pending approvals
- lastSignals: cached typed signal snapshot
- pendingApproval: active approval payload with objective and expiry
- lastApprovalDecision: approved, deferred, rejected, or null
- consecutiveFailures: number of back-to-back failed cycles
- backoffLevel: multiplier step applied to the next interval
- history: append-only recent cycle outcomes

## Cycle Stages
1. Collect typed signals from recent session activity.
2. Classify urgency using deterministic rules.
3. Select a single action from the action registry.
4. Build a structured heartbeat request envelope.
5. Execute the action or queue approval if edit-capable and approval is required.
6. Persist state, update status UI, and schedule the next cycle.

## Typed Signal Tiers
1. Fast tier (always available): session-derived counters and typed snapshots.
2. Cached tier: reuse recent signals for the configured TTL to reduce churn.
3. External probe tier: structured snapshots returned from agent-driven command probes.
4. Future tier: direct diagnostics/test/git integration when extension APIs provide stronger access.

## External Probe Marker
When requesting a probe, the runtime expects this marker in assistant output:

HEARTBEAT_SIGNAL_SNAPSHOT
{
	"collectedAt": "ISO timestamp",
	"diagnostics": { "available": true, "errorCount": 0, "warningCount": 0, "infoCount": 0 },
	"tests": { "available": true, "failedCount": 0, "hasFailures": false },
	"git": { "available": true, "isDirty": false, "stagedCount": 0, "unstagedCount": 0, "branch": "main" }
}

If a signal is unavailable, set available=false and provide zero/null values.

## Action Registry
- idle: no meaningful maintenance signal detected
- summarize: recent workspace activity exists, but there is no urgent failure signal
- maintenance-pass: queue a bounded heartbeat request envelope for the dedicated heartbeat agent contract
- awaiting-approval: hold an edit-capable objective until the operator approves, defers, or rejects

## Handoff Protocol
1. Runtime creates a heartbeat request envelope with cycle metadata, mode flags, typed signals, and allowedActions.
2. Runtime dispatches the envelope as a steer prompt for heartbeat-maintainer.
3. heartbeat-maintainer returns the structured cycle result contract.
4. If the cycle is edit-capable and approved, implementation handoff must route through gen-disc-orchestrator.

## Safety Boundaries
1. No recursive self-looping inside the delegated agent.
2. No destructive git operations.
3. No broad cleanups or style-only rewrites.
4. No acting on the same issue every cycle without a changed signal fingerprint.
5. No hidden state outside the persisted heartbeat entry.

## Current Implementation Scope
The first implementation uses session-entry heuristics because that capability already exists in the local extension examples. It can start, stop, pause, resume, run once, change interval, and queue maintenance steer messages. Richer workspace signals such as diagnostics or git state can be added once a stable extension-side access path is available.

## Commands
- /heartbeat
- /heartbeat-start [seconds]
- /heartbeat-stop
- /heartbeat-pause
- /heartbeat-resume
- /heartbeat-run-once
- /heartbeat-interval <seconds>
- /heartbeat-signal-ttl <seconds>
- /heartbeat-probe-ttl <seconds>
- /heartbeat-probe-now
- /heartbeat-approval-timeout <seconds>
- /heartbeat-focus <goal>
- /heartbeat-dry-run on|off
- /heartbeat-edit on|off
- /heartbeat-approval on|off
- /heartbeat-pending
- /heartbeat-approve
- /heartbeat-defer
- /heartbeat-reject

## Current Limits
1. Typed signals are currently inferred from session entries unless an external probe marker is ingested.
2. Structured handoff is dispatched as steer instructions; native runtime agent-call APIs can replace this when available.
3. Approval gates currently use command-driven controls; richer UI approval workflows can be added later.
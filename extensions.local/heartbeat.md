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

## Extension API Assumptions And Fallbacks
The current implementation assumes these host APIs may be partial or unavailable and degrades without crashing scheduler, cycle execution, or turn_start parsing.

| API surface | Primary usage | Fallback when unavailable/failing | Observability |
| --- | --- | --- | --- |
| ctx.sessionManager.getEntries | restore state, collect typed signals, turn_start parsing | use empty entry list and continue cycle/parse logic | degraded marker appended to lastOutcome when possible |
| ctx.ui.notify | user-facing command and lifecycle notices | no-op; state machine continues | degraded marker appended to lastOutcome |
| ctx.ui.setStatus | heartbeat status indicator | no-op; scheduler and commands continue | degraded marker appended to lastOutcome |
| pi.registerCommand | command registration at startup | skip command registration that failed and continue initialization | degraded marker appended to lastOutcome |
| pi.appendEntry | persisted heartbeat state/history snapshots | skip persistence write and continue with in-memory state | degraded marker appended to lastOutcome |
| pi.sendUserMessage | maintenance/probe steer handoff dispatch | keep cycle non-fatal and mark dispatch as degraded outcome | lastOutcome explicitly reports dispatch failure |

Notes:
1. Behavior is unchanged when the APIs are available.
2. Parser failures in turn_start remain best-effort and non-fatal.
3. Fallback paths are intentionally minimal and intent-preserving.

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
- lastOrchestratorAudit: latest normalized downstream orchestrator payload metadata captured during turn_start parsing
- consecutiveFailures: number of back-to-back failed cycles
- backoffLevel: multiplier step applied to the next interval
- history: append-only recent cycle outcomes

History entry extensions:
1. orchestratorAudit (optional): last normalized downstream metadata attached to the most recent history entry when parsed.
2. orchestratorAudit.capturedAt: ISO timestamp of metadata capture time.
3. orchestratorAudit.status/verdict: normalized orchestrator status plus optional policy verdict.
4. orchestratorAudit.attemptsUsed/retryCount: downstream attempts and retry metadata when present.
5. orchestratorAudit.filesTouched/policySummary/nextAction/handoffTarget: summarized downstream output for audit/debugging.

## Cycle Stages
1. Collect typed signals from recent session activity.
2. Classify urgency using deterministic rules.
3. Select a single action from the action registry.
4. Build a structured heartbeat request envelope.
5. Execute the action or queue approval if edit-capable and approval is required.
6. Persist state, update status UI, and schedule the next cycle.

## Typed Signal Tiers
1. Cached tier: reuse recent signals for the configured TTL to reduce churn.
2. Direct adapter tier: parse normalized diagnostics/test/git signals from available session/runtime text payloads.
3. External probe tier: structured snapshots returned from agent-driven command probes.
4. Heuristic fallback tier: session-derived counters and typed snapshots when direct/probe signals are unavailable.

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

## Deterministic Parse Contracts
1. heartbeat-maintainer output is parsed from required key-value lines: selected_objective, action_taken, outcome, and next_risk.
2. policy-discriminator output is parsed from required key-value lines: verdict and confidence, with optional bullet lists for failed_checks and fix_directives.
3. orchestrator downstream result payloads are parsed best-effort from status/verdict, attempts_used, files_touched, policy_summary, next_action, and handoff target fields.
4. Parser failures are best-effort and non-fatal; they must not crash cycle scheduling.

## Safety Boundaries
1. No recursive self-looping inside the delegated agent.
2. No destructive git operations.
3. No broad cleanups or style-only rewrites.
4. No acting on the same issue every cycle without a changed signal fingerprint.
5. No hidden state outside the persisted heartbeat entry.

## Current Implementation Scope
The implementation uses a bounded signal precedence chain: direct adapter extraction from session/runtime payloads, then external probe snapshots, then session heuristics fallback. It can start, stop, pause, resume, run once, change interval, and queue maintenance steer messages.

Approval UX currently includes command-driven review details with explicit risk, time-to-expiry, objective summary, and one-step action hints for approve, defer, and reject.

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
1. Direct adapters depend on structured or strongly-marked runtime text; weak payloads fall back to probe/heuristics.
2. Structured handoff is dispatched as steer instructions; native runtime agent-call APIs can replace this when available.
3. Approval gates currently use command-driven controls; richer UI approval workflows can be added later.

## Oracle Checks
- Parser oracle: `node extensions.local/test-oracles/validate-output-parsers.js`
- Policy discriminator oracle: `node extensions.local/test-oracles/validate-policy-discriminator-oracle.js`
- Approval lifecycle oracle: `node extensions.local/test-oracles/validate-heartbeat-lifecycle.js`
- Lifecycle enrichment oracle: `node extensions.local/test-oracles/validate-heartbeat-lifecycle-enrichment.js`
- API capability oracle: `node extensions.local/test-oracles/validate-api-capabilities.js`
- Signal adapter oracle: `node extensions.local/test-oracles/validate-signal-adapters.js`
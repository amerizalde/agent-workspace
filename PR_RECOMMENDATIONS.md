# Future PR Recommendations

Date: 2026-04-13

## Priority Order

1. Agent Output Schema Validation and Tests
- Purpose: enforce deterministic parsing of maintainer and discriminator outputs.
- Key files: extensions.local/heartbeat-agent.ts, .github/agents/heartbeat-maintainer.agent.md, .github/agents/policy-discriminator.agent.md
- Effort: M
- Value: highest reliability gain for autonomous workflows.
- Contrarian view: strict schema validation can over-constrain fast iteration if prompt formats intentionally evolve frequently.

2. Heartbeat Approval Lifecycle Test Suite
- Purpose: test approve, defer, reject, timeout, and reload recovery paths.
- Key files: extensions.local/heartbeat-agent.ts, new tests under extensions.local/
- Effort: M
- Value: hardens the safety-critical gate before autonomous edits.
- Contrarian view: deep lifecycle tests may be premature until approval behavior is stabilized in real operator usage.

3. Extension API Contract Validation and Fallbacks
- Purpose: validate runtime API assumptions and add graceful fallback behavior.
- Key files: extensions.local/heartbeat-agent.ts, extensions.local/heartbeat.md
- Effort: M
- Value: deployment confidence and resilience across host differences.
- Contrarian view: if deployment target is fixed and known, broad fallback logic can add complexity without immediate payoff.

4. Direct Signal Adapters for Diagnostics, Tests, and Git
- Purpose: reduce heuristic dependence and improve signal accuracy.
- Key files: extensions.local/heartbeat-agent.ts
- Effort: M/L
- Value: better maintenance decisions and fewer false positives.
- Contrarian view: richer adapters can increase maintenance burden; lightweight heuristics may be sufficient for an internal-only workflow.

5. Orchestrator Handoff Audit Trail Enrichment
- Purpose: persist downstream verdicts, touched files, retries, and handoff targets.
- Key files: extensions.local/heartbeat-agent.ts, .github/agents/orchestrator.agent.md
- Effort: S/M
- Value: stronger observability and easier incident debugging.
- Contrarian view: detailed audit payloads can become noisy and harder to interpret without a matching query/reporting layer.

6. Policy Discriminator Oracle Test Pack
- Purpose: reduce false pass/fail rates with snippet-based expected outcomes.
- Key files: .github/agents/policy-discriminator.agent.md, new tests under .github/agents/
- Effort: M
- Value: safer autonomous edits and more predictable reviews.
- Contrarian view: oracle tests may bias toward current heuristics and discourage broader improvements in review strategy.

7. State Versioning and Migration Guards
- Purpose: prevent breakage when persisted state schema evolves.
- Key files: extensions.local/heartbeat-agent.ts, extensions.local/coder-policy.ts
- Effort: S/M
- Value: long-term stability of extension state.
- Contrarian view: versioning overhead can be deferred if state shape is still changing rapidly and sessions are short-lived.

8. CI Quality Gate Workflow
- Purpose: run lint, type checks, and tests on pull requests.
- Key files: .github/workflows/, project scripts as needed
- Effort: M
- Value: earlier regression detection and consistent quality bar.
- Contrarian view: strict gates can slow early experimentation if test suites are still sparse and flaky.

9. Approval UX Polish
- Purpose: improve pending plan review and operator decision clarity.
- Key files: extensions.local/heartbeat-agent.ts, extensions.local/heartbeat.md
- Effort: S/M
- Value: safer and faster human-in-the-loop operation.
- Contrarian view: UX polish can wait until core reliability and contract correctness are proven under real load.

## Immediate Next Three

1. Agent Output Schema Validation and Tests
2. Heartbeat Approval Lifecycle Test Suite
3. Extension API Contract Validation and Fallbacks

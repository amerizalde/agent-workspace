# Coder Policy Extension Design (Minimal)

## Goal
Enforce an always-on coding style where generated code is:
- functional-first
- self-documenting
- small, composable, and explicit about data flow

## Policy Contract
The extension enforces these rules on every coding turn:
1. Prefer pure functions over mutable, stateful procedures.
2. Keep functions focused on one responsibility.
3. Use descriptive names for functions, parameters, and locals.
4. Avoid hidden side effects; make inputs/outputs explicit.
5. Add short docstrings/comments only when intent is not obvious from code.
6. Return structured, deterministic outputs from helper logic.
7. Do not introduce style-only refactors unless asked.

## Runtime Strategy (Minimal Hooks)
1. Use before_agent_start to inject a turn-level system instruction that carries the policy contract.
2. Use tool_call to guard edit/write calls that look like broad, style-only rewrites.
3. Use tool_result to run lightweight post-checks and queue one corrective steer message when needed.
4. Use session_start to restore persisted strictness settings.
5. Use appendEntry to persist state updates.

## Minimal State Model
- strictMode: on by default
- autoRepair: on by default
- violationBudgetPerTurn: 1

## Minimal Commands
- /coder-policy
  - Show current mode and last violation summary.
- /coder-policy-strict on|off
  - Toggle strict enforcement.
- /coder-policy-repair on|off
  - Toggle automatic corrective steering.

## Violation Heuristics (Simple, Deterministic)
1. Function naming check:
   - Flag obvious placeholder names in new code (tmp, foo, bar, test).
2. Purity preference check:
   - Flag avoidable global mutation in newly added function bodies.
3. Complexity check:
   - Flag oversized newly generated functions using a simple line threshold.
4. Intent clarity check:
   - Flag non-obvious control flow blocks with no explanatory comment/docstring.

## Enforcement Behavior
1. strictMode on:
   - tool_call can block suspicious broad rewrites.
   - tool_result can queue one auto-repair steer message when violations exist.
2. strictMode off:
   - advisory warnings only; no blocking.
3. autoRepair off:
   - no steer message; warnings only.

## Safety and Scope Boundaries
Included:
- New code and modified code produced during the current run.

Excluded:
- Repository-wide normalization.
- Deep language semantic linting.
- Architectural refactors not requested by the user.

## Verification Plan
1. Ask for a feature with helper functions.
   - Expect descriptive names and explicit data flow.
2. Ask for a style-only broad rewrite.
   - Expect block in strict mode.
3. Disable strict mode and retry.
   - Expect advisory behavior.
4. Restart and verify mode persistence.

## API Mapping
- Events: before_agent_start, turn_start, tool_call, tool_result, session_start
- Persistence: appendEntry + session reconstruction from custom entries
- Controls: registerCommand
- UX: ui.setStatus

# Custom Agents

This repository uses a four-agent workflow for policy-gated coding in VS Code custom agents.

## Agents

### gen-disc-orchestrator
Path: .github/agents/orchestrator.agent.md
Role: Coordinates planning, generation, and discrimination with bounded retries.

### planning-agent
Path: .github/agents/planning-agent.agent.md
Role: Produces a concise implementation plan and scoped steps before coding.

### functional-generator
Path: .github/agents/functional-generator.agent.md
Role: Implements changes in a functional, self-documenting style.

### policy-discriminator
Path: .github/agents/policy-discriminator.agent.md
Role: Validates modified code with a strict pass/fail rubric and targeted directives.

### heartbeat-maintainer
Path: .github/agents/heartbeat-maintainer.agent.md
Role: Executes one bounded heartbeat maintenance cycle for the extension-backed autonomous maintenance loop.

## Workflow
This is the main "build and check" workflow in plain language:
1. The orchestrator asks the planning-agent to make a short plan.
2. The orchestrator asks the functional-generator to write the code from that plan.
3. The orchestrator asks the policy-discriminator to review the result.
4. If review fails, the orchestrator sends specific fix instructions back to the functional-generator.
5. The loop ends when review passes, or after 2 fix rounds.

## Heartbeat Workflow
This is the "background maintenance" workflow in plain language:
1. The extension runtime handles the timer, saved state, and status display.
2. On each heartbeat, it checks signals and picks one small maintenance task.
3. It gives that one task to heartbeat-maintainer.
4. heartbeat-maintainer either does nothing, gives a recommendation, or triggers one bounded handoff for planning/implementation.
5. The runtime saves what happened and schedules the next heartbeat, including backoff if needed.

## Policy Goals
- Functional, composable code.
- Self-documenting naming and concise explanatory comments when needed.
- Minimal intent-preserving edits.
- No broad style-only rewrites.

## Invocation
Use the agent picker and select gen-disc-orchestrator.

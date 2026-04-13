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
1. Orchestrator delegates planning to Planning Agent.
2. Orchestrator delegates implementation to Functional Generator.
3. Orchestrator delegates review to Policy Discriminator.
4. On FAIL, orchestrator sends targeted directives back to Functional Generator.
5. Loop stops on PASS or after 2 corrective rounds.

## Heartbeat Workflow
1. The extension runtime in extensions.local owns scheduling, persistence, and status UI.
2. Each heartbeat cycle gathers signals and chooses one bounded maintenance objective.
3. The runtime delegates that single objective to heartbeat-maintainer.
4. heartbeat-maintainer returns a no-op, a recommendation, or one bounded planning/implementation handoff.
5. The runtime records the outcome and schedules the next cycle with backoff when needed.

## Policy Goals
- Functional, composable code.
- Self-documenting naming and concise explanatory comments when needed.
- Minimal intent-preserving edits.
- No broad style-only rewrites.

## Invocation
Use the agent picker and select gen-disc-orchestrator.

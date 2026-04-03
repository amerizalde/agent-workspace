# Custom Agents

This repository uses a three-agent workflow for policy-gated coding in VS Code custom agents.

## Agents

### gen-disc-orchestrator
Path: .github/agents/orchestrator.agent.md
Role: Coordinates generator and discriminator with bounded retries.

### functional-generator
Path: .github/agents/functional-generator.agent.md
Role: Implements changes in a functional, self-documenting style.

### policy-discriminator
Path: .github/agents/policy-discriminator.agent.md
Role: Validates modified code with a strict pass/fail rubric and targeted directives.

## Workflow
1. Orchestrator delegates implementation to Functional Generator.
2. Orchestrator delegates review to Policy Discriminator.
3. On FAIL, orchestrator sends targeted directives back to Functional Generator.
4. Loop stops on PASS or after 2 corrective rounds.

## Policy Goals
- Functional, composable code.
- Self-documenting naming and concise explanatory comments when needed.
- Minimal intent-preserving edits.
- No broad style-only rewrites.

## Invocation
Use the agent picker and select gen-disc-orchestrator.

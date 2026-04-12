---
name: repo-to-app-prompt
description: "Use when the user provides a GitHub repository URL and wants you to determine the repository's primary purpose, summarize its main functionality, and generate a new-app prompt that recreates the same core behavior without copying implementation details. Trigger for requests like analyze this GitHub repo, reverse engineer this repo into a prompt, infer what this repo does, or turn a GitHub URL into an app-building prompt."
argument-hint: "[GitHub URL] [optional target stack or output type]"
---

# Repo To App Prompt

Use this skill when the user shares a public GitHub repository URL and wants a prompt that would create a new app with the same primary function.

## Goal

Produce a grounded, original prompt that captures the repository's main job, user-facing workflow, and core capabilities without copying code, branding, or large text excerpts.

## Inputs

- Repository URL, ideally a GitHub URL.
- Optional target stack, platform, or output shape such as React web app, CLI, Python service, or mobile app.

## Required Workflow

1. Normalize the repository URL.
   Accept `https://github.com/owner/repo`, `owner/repo`, and `.git` variants when the owner and repo are unambiguous.

2. Gather evidence before inferring purpose.
   Start with high-signal sources:
   - Repository metadata and description.
   - `README*`.
   - Package or manifest files such as `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, or `setup.py`.
   - Primary entry points or top-level folders if needed.
   Use the checklist in [evidence-checklist.md](./evidence-checklist.md).

3. Identify the repository type.
   Classify it as one of:
   - app
   - library or SDK
   - template or starter
   - plugin or extension
   - infrastructure or config repo
   If it is not an app, generate a prompt for a small application or tool that demonstrates the same primary function in a user-usable form.

4. Infer the primary function.
   Reduce the repo to one main job in one sentence. Distinguish between:
   - primary function: the core job the software performs
   - supporting details: stack, deployment, integrations, internal architecture
   If several functions exist, rank them and choose the dominant one based on evidence frequency and prominence.

5. Extract only the minimum set of essential features.
   Keep features outcome-focused. Avoid copying naming, file layout, or repo-specific implementation details.

6. Generate the final build prompt.
   Follow the structure in [prompt-template.md](./prompt-template.md).
   The prompt should:
   - describe the app goal clearly
   - name the key user flows and required outputs
   - specify a suggested stack if the user requested one or if the source repo strongly implies one
   - avoid direct code imitation
   - avoid copying README prose except short paraphrases

7. Report uncertainty explicitly.
   If the repository is ambiguous, incomplete, private, or mostly infrastructure, say so and lower confidence rather than inventing details.

## Output Format

Return these sections in order:

1. `Purpose`
   One sentence describing the repo's primary function.

2. `Evidence`
   A short list of the files or signals used to infer the purpose.

3. `Core Features`
   A concise list of the minimum features needed to reproduce the primary function.

4. `Suggested Stack`
   Include only if the stack is relevant or requested.

5. `Generated Prompt`
   A clean prompt for building a new app with the same core function.

6. `Confidence`
   Use `high`, `medium`, or `low` with one short reason.

## Guardrails

- Do not reproduce source code.
- Do not copy long README sections.
- Do not preserve branding, project name, or unique marketing language unless the user explicitly asks.
- Focus on behavior and user value, not the exact implementation.
- If the repository is primarily a library, framework, or plugin, convert its central capability into a small usable app or demo prompt instead of pretending it is already an app.

## Example Requests

- `/repo-to-app-prompt https://github.com/owner/repo`
- `/repo-to-app-prompt https://github.com/owner/repo make it a React app`
- `Analyze this GitHub URL and generate a prompt that recreates the same primary function.`

## Quality Bar

- Evidence first, inference second.
- One dominant purpose, not a vague summary.
- Features should be minimal and sufficient.
- Prompt should be original and implementation-agnostic.
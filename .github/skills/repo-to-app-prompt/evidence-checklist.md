# Evidence Checklist

Use this checklist before deciding what the repository primarily does.

## Highest Signal

- Repository description and topics.
- `README.md` title, opening paragraphs, feature list, usage examples.
- Manifest files that reveal runtime, framework, and entry points.

## Medium Signal

- Top-level directories such as `src`, `app`, `server`, `cli`, `docs`, `examples`.
- Example commands in documentation.
- Screenshots or GIF captions that reveal the main user workflow.

## Low Signal

- Dependency lists without usage context.
- CI configuration.
- Deployment scripts.
- Test helpers.

## Decision Rules

1. Prefer explicit README claims over guesses from dependencies.
2. Prefer repeated user-facing outcomes over internal implementation details.
3. If the repo appears to be a library, state the capability it exposes and translate that into a small usable app or demo tool.
4. If the repo is a starter or boilerplate, identify the kind of app it is meant to help build rather than describing the template mechanics.
5. If evidence conflicts, mention the conflict briefly and lower confidence.
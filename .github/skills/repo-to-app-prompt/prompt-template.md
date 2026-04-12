# Prompt Template

Use this structure when generating the final prompt.

```text
Build a [app type] that [primary function].

The app should help users [main outcome] by providing these core capabilities:
- [feature 1]
- [feature 2]
- [feature 3]

Primary user flow:
1. [first step]
2. [second step]
3. [result]

Technical direction:
- Use [suggested stack or platform]
- Keep the architecture simple and production-ready
- Include clear error handling and empty states

Constraints:
- Recreate the same core behavior, not the original branding or implementation
- Do not copy code or repo-specific text
- Focus on the minimum feature set needed to deliver the main value

Deliverables:
- [UI or interface]
- [core logic]
- [basic persistence or integration if relevant]
- [brief setup instructions]
```

Adapt the wording to the repository type:

- For an app: preserve the user-facing workflow.
- For a library: turn the main capability into a simple demo app or tool.
- For a CLI: keep the command-oriented interaction model.
- For an extension or plugin: preserve the host environment and user action flow.
# Iterative Visual Loop - Development Progress Report

## Project Status: In Development

## Architecture

### Three-Agent System

| Agent | Purpose | Tool Access |
|-------|---------|-------------|
| **CodeAgent** | Initial HTML generation from image | None (LLM-only) |
| **EditorAgent** | Apply refinements to code | multi_edit, todo_list |
| **VerifierAgent** | Visual critique vs reference | Image analysis |
| **System** | Workflow orchestration | Rate limiting, state |

### Workflow Cycle

```
START → Code Generation → Verify → Critique → Edit → Repeat until DEPLOYABLE
```

## Core Components

### CodeAgent (HTML Generator)

Generates 1000+ line HTML files with:
- Three.js scene setup
- HDRI environment lighting
- Camera inspection views
- Animation loop
- Window global state export

### EditorAgent (Refinement Agent)

Applies fixes via multi_edit tool:
- Creates TODO list
- Applies targeted edits
- Marks todos complete
- Validates changes

### VerifierAgent (Art Director)

Critiques visual quality:
- Compares to reference
- Rates quality level
- Provides 8-10 technical directives
- Suggests fixes

### SystemAgent (Orchestrator)

Manages workflow state:
- Tracks iterations
- Enforces rate limits (5/min)
- Handles errors with backoff
- Triggers webhooks

## Utilities

### Screenshot Capture

```typescript
import captureScreenshot from './utils/screenshot';

const result = await captureScreenshot({
    elementId: 'scene-canvas',
    width: 1920,
    height: 1080
});
```

### Video Recording

15-second video capture at ~60fps for quality verification.

### Rate Limiting

Exponential backoff (15s → 30s → ... → 120s)
with 12s min delay between requests.

## Scene Templates

Available templates:
1. **Product Showroom** - Studio lighting, product details
2. **Architecture Exterior** - Building facades, natural light
3. **Nature Forest** - Organic materials, volumetric fog
4. **Urban Street** - City environment, traffic elements

## Materials Library

8 PBR materials:
- Steel, Glass, Water
- Wood, Leather, Skin
- Concrete, Rubber

## Testing

Basic test suite in `utils/__tests__/workflow.test.ts`:
- Scene generation validation
- Material definitions
- Template availability

## Next Steps

- [ ] End-to-end workflow testing
- [ ] Complete testing with real images
- [ ] Full texture pack (PBR maps)
- [ ] Webhook automation integration
- [ ] Production deployment config

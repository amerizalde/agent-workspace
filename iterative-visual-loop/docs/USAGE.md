# Iterative Visual Loop - Usage Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## Agent Usage

### Generate Scene

```typescript
import { AgentService } from './services/google_ai/agent-service';

const agent = new AgentService({
    apiKey: process.env.API_KEY
});

const scene = await agent.callCodeAgent(
    'product_image.jpg',
    'Professional product showcase'
);
```

### Process with Verifier

```typescript
const critique = await agent.callVerifierAgent(
    generatedSceneUrl,
    referenceImageUrl
);

// critique.output: string of directives
```

### Apply Edits

```typescript
const edits = await agent.callEditorAgent(
    currentCode,
    critique.output
);

// edits: [] of [filePath, oldText, newText]
```

## Screenshot/Video

```typescript
// Capture screenshot
const screenshotResult = await captureScreenshot({
    elementId: 'scene-canvas'
});

// Start 15s recording
const recording = await startRecording({
    elementId: 'scene-canvas',
    duration: 15
});
```

## Quality Levels

| Level | Score | Status |
|-------|-------|-------|
| BRONZE | 1-2 | ✅ Acceptable |
| SILVER | 3-4 | ⚠️ Needs work |
| GOLD | 5-7 | ⚠️ Needs polishing |
| PLATINUM | 8-9 | ✅ Excellent |
| DEPLOYABLE | 10 | ✅ Release-ready |

## Environment

```bash
API_KEY=your-google-genai-api-key
WEBHOOK_URL=https://your-endpoint.com
```

## Error Handling

Rate limits are automatic (12s delay, 5 retries).
Common errors:
- "Rate limit exceeded" - Wait 12s+
- "Invalid image" - Verify URL is accessible
- "Empty response" - Check API_KEY environment variable

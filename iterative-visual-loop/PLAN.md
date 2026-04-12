# Iterative Visual Loop Analysis & Implementation Guide

> **A Multi-Agent AI System for Photorealistic 3D Scene Generation**
> 
> Clone URL: https://github.com/ryoiki-tokuiten/Iterative-Visual-Loop

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Technical Stack](#technical-stack)
4. [Agent Workflow](#agent-workflow)
5. [Implementation Guide](#implementation-guide)
6. [Key Components](#key-components)
7. [Use Cases](#use-cases)
8. [API Reference](#api-reference)
9. [Recommendations](#recommendations)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Core Purpose

**Iterative Visual Loop** is an AI-powered multi-agent system that generates and refines photorealistic 3D voxel scenes from reference images through a sophisticated cycle of: generation → critique → refinement → verification.

### Key Features

- ✅ **Multi-Agent Architecture**: Coder, Editor, Verifier agents collaborate
- ✅ **Iterative Refinement**: Continuous improvement with visual feedback  
- ✅ **Photorealistic Output**: Achieves "Platinum" visual quality
- ✅ **Streaming Responses**: Real-time thought visibility
- ✅ **Visual Verification**: Screenshot + video capture
- ✅ **Robust Error Handling**: Rate limiting, exponential backoff

### Quality Levels

1. **BRONZE**: Recognizable but basic quality (game graphics quality)
2. **SILVER**: Good lighting, synthetic materials
3. **GOLD**: High quality, subtle differences
4. **PLATINUM**: Indistinguishable from reference
5. **DEPLOYABLE**: Production-ready, approved for release

---

## Architecture Deep Dive

### Three-Agent System

| Agent | Role | Primary Function | Tools |
|-------|------|----|-------|
| **CodeAgent** | Scene Architect | Initial HTML generation from image | None |
| **TheEditorAgent** | Implementation Agent | Applies refinements based on critique | `multi_edit`, `read_file`, `todo_list`, `take_screenshot`, `verify_changes` |
| **VerifierAgent** | Art Director | Critiques visual output vs reference | None |
| **System** | Orchestrator | Workflow state management | Internal |

### Workflow Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW FLOWCHART                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  START → Upload Reference Image → Code Agent                 │
│              ↓                                                │
│         Generate Initial HTML (1000+ lines)                  │
│              ↓                                                │
│         Save Code Version #1 (Initial Generation)            │
│              ↓                                                │
│         Start Refinement Loop (max 20 iterations)            │
│              ↓                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                   ITERATION LOOP                          ││
│  │  ┌─────────────────┬─────────────────┬──────────────────┐││
│  │  │ Capture Screens │ Generate Rec.  │ Verifier Agent    │││
│  │  │ & Recording     │                  │ critiques both   │││
│  │  └────────┬────────┴───────────┬─────┴──────────────────┘││
│  │           ↓                    ↓                          ││
│  │  Verifier provides 8-10 technical directives              ││
│  │  (Issue/Current/Target/Fix)                               ││
│  │           ↓                                                ││
│  │  Editor Agent:                                            ││
│  │  1. Creates TODO list                                      ││
│  │  2. Uses multi_edit to apply fixes                        ││
│  │  3. Mark todos done                                        ││
│  │           ↓                                                ││
│  │  [Verify Changes / Submit for Review]                     ││
│  │  OR Add More Inspection Views                             ││
│  │           ↓                                                ││
│  │  REPEAT OR EXIT (DEPLOYABLE)                               ││
│  └──────────────────────────────────────────────────────────┘│
│              ↓                                                │
│         EXIT → DEPLOYABLE → END                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Critical Design Principles

1. **Photorealism is Cumulative**: Rarely one big change, but sum of 100 small improvements
2. **Visual Feedback First**: Don't trust code alone, verify visually
3. **Preserve Integrity**: Don't break syntax or animate() loop
4. **Aggressive Implementation**: Fix things comprehensively, not partially
5. **Self-Correction**: Watch for black screens (renderer config broken)

---

## Technical Stack

### Frontend Framework
- **React 19.2.1** - Latest version with modern hooks
- **Vite 6.2.0** - Development server and build tooling
- **TypeScript 5.8.2** - Type-safe development

### Core Dependencies
```json
{
  "@google/genai": "^1.31.0",
  "react-markdown": "^10.0.0",
  "html2canvas": "^1.4.1",
  "prism-react-renderer": "^2.4.1",
  "react-icons": "^5.4.0",
  "react-diff-viewer-continued": "^4.0.5",
  "diff": "^5.2.0"
}
```

### AI Models
- **Google Gemini 3 Pro** (text) - Main reasoning engine
- **Gemini 3 Pro Image** - For visual analysis feedback
- **Model**: `gemini-3-flash-preview`

### Rate Limiting Configuration

| Feature | Value | Purpose |
|---------|-------|---------|
| Max Requests Per Minute | 5 | Free tier compliance |
| Min Delay Between Requests | 12s | Prevent rate limit hits |
| Max Retries | 5 | Handle transient errors |
| Base Backoff | 15s | Start delay |
| Max Backoff | 120s | Max retry delay |
| Backoff Multiplier | 2 | Exponential base |

---

## Agent Workflow

### 1. Code Agent (Voxel Architect)

**Purpose**: Generate initial photorealistic scene from reference image

**Prompt**: `PROMPTS.CODE_AGENT`

**Key Requirements**:
- Exceeds 1000 lines for production quality
- Uses `preserveDrawingBuffer: true` (critical for screenshots)
- Configures HDRI environment lighting from Poly Haven
- Defines `window.inspectionViews` for camera paths
- Exposes `window.scene`, `window.camera`, `window.renderer`, `window.controls`

**Typical Output Structure**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>[Scene Title]</title>
    <style>body { margin: 0; overflow: hidden; }</style>
</head>
<body>
    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls, RGBELoader, EffectComposer } from 'three/addons/...';
        
        // 1. Setup Scene, Camera, Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true, // CRITICAL for recordings
            powerPreference: "high-performance"
        });
        
        renderer.shadowMap.enabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        
        // 2. Global State (for supervisor access)
        window.scene = scene;
        window.camera = camera;
        window.renderer = renderer;
        window.controls = controls; // CRITICAL for recording
        window.inspectionViews = [
            { position: [10, 5, 10], target: [0, 0, 0], label: "Overview" },
            { position: [2, 1, 2], target: [0, 0.5, 0], label: "Macro Detail" },
            { position: [0, 20, 0], target: [0, 0, 0], label: "Top Down" },
        ];
        
        // 3. Scene construction, materials, lighting, animation loop
    </script>
</body>
</html>
```

**Inspection Views Configuration** (critical for video capture):
The supervisor receives both screenshots and a 15-second 60FPS recording. If `window.inspectionViews` is defined, the camera smoothly transitions between each view. If not defined, it falls back to a simple 360° orbit.

```javascript
window.inspectionViews = [
    { position: [10, 5, 10], target: [0, 0, 0

---

## Technical Stack

### Frontend
- **React 19.2.1** with modern hooks
- **Vite 6.2.0** for dev server
- **TypeScript 5.8.2**

### AI
- **Google Gemini 3 Pro** (text)  
- **gemini-3-flash-preview** model

### Rate Limiting
- **5 requests/minute**
- **12second delay** minimum
- **5 retries** with exponential backoff

### Use Cases

1. **Product Visualization**: Marketing renders of products
2. **Architectural Visualization**: Building designs from plans
3. **Game Asset Prototyping**: Rapid iteration on materials/lights
4. **Educational Content**: 3D diagrams and explainer scenes
5. **Real Estate**: Virtual tours and property showcases

---

## API Reference

### Agent Types
- **CodeAgent**: Initial generation
- **EditorAgent**: Refinement implementation
- **VerifierAgent**: Visual quality control
- **SystemAgent**: Workflow orchestration

### Quality Levels
1. **BRONZE** - Recognizable but basic
2. **SILVER** - Good lighting, synthetic materials
3. **GOLD** - High quality, subtle differences
4. **PLATINUM** - Indistinguishable from reference
5. **DEPLOYABLE** - Production-ready output

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Black screenshot | Verify preserveDrawingBuffer enabled |
| Rate limits | 12s auto-delay |
| Empty code | Check API_KEY environment variable |
| Recording black | Ensure window.controls set |


---

## API Reference

### Agent Types

| Agent | Role | Function |
|-------|------|------|
| CodeAgent | Initial Generation | Creates 1000+ line HTML |
| EditorAgent | Refinement | Applies fixes via tools |
| VerifierAgent | Quality Control | Visual critique |
| SystemAgent | Orchestration | Workflow management |

### Quality Levels
1. **BRONZE**: Recognizable but basic
2. **SILVER**: Good lighting, synthetic materials
3. **GOLD**: High quality, subtle differences
4. **PLATINUM**: Indistinguishable from reference
5. **DEPLOYABLE**: Production-ready

---

## File Structure

```
iterative-visual-loop/
┒
├── components/
│   ├── App.tsx                  # Main app container
│   ├── CodePreview.tsx          # Three.js renderer
│   ├── DiffViewer.tsx           # Code diff display
│   ├── HistoryPanel.tsx         # Version navigation
│   └── ArtifactGallery.tsx      # Screenshots/videos
├── services/
│   └── google_ai/
│       └── agent-service.ts     # LLM orchestration
├── utils/
│   ├── screenshot.ts            # html2canvas
│   ├── recording.ts             # 15s video logic
│   └── tools/
│       ├── multi_edit-tool.ts
│       ├── todo-list-tool.ts
│       ├── verify-changes-tool.ts
│       └── take-screenshot-tool.ts
├── constants.ts                 # Prompt templates
├── types.ts                     # TypeScript types
├── index.tsx                    # Mount point
├── README.md
└── package.json
```

---

## TypeScript Types

```typescript
export type AgentType = 'coder' | 'editor' | 'verifier' | 'system';

export enum WorkflowStatus {
  IDLE,
  CODING,
  RENDERING,
  CRITIQUING,
  EDITING,
  VERIFYING,
  COMPLETED,
  ERROR
}

export interface CodeVersion {
  id: number;
  timestamp: string;
  code: string;
  description: string;
}

export interface GeneratedArtifact {
  id: string;
  type: 'screenshot' | 'video';
  url: string;
  description: string;
}
```

---

## Recommendations

### 1. Create Custom Prompts
- Product visualization prompts
- Architectural visualization
- Nature scenes (organic forms, foliage)
- Urban scenes (geometry, traffic)
- Abstract/artistic styles

### 2. Build Texture Libraries
- PBR texture collections
- HDRI environment library
- Material preset packages

### 3. Add Automation
- Webhook triggers from Figma/Sketch
- Batch generation for variations
- Scheduled refinement cycles

### 4. Export Formats
- Multiple camera angles
- Video walkthroughs
- Variation sets

---

## Version Information

**Version**: 1.0  
**Last Updated**: System auto-generated  
**Repository**: https://github.com/ryoiki-tokuiten/Iterative-Visual-Loop

---

**End of Analysis Document**

<div style="text-align: center; color: #666; margin-top: 3rem;">
  <p>Made with ✨ for production-quality 3D rendering<br />
  <a href="https://github.com/ryoiki-tokuiten/Iterative-Visual-Loop">Repository</a> | 
  <a href="#">Documentation</a>
  </p>
</div>

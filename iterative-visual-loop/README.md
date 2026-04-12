# Iterative Visual Loop

> **Multi-Agent AI System for Photorealistic 3D Scene Generation**  
> Clone URL: https://github.com/ryoiki-tokuiten/Iterative-Visual-Loop

## Status: 🚧 In Development v1.0

This multi-agent AI system generates and refines photorealistic 3D voxel scenes from reference images through a sophisticated cycle of: generation → critique → refinement → verification.

![Workflow](https://img.shields.io/badge/AI-System-orange)  
![Quality](https://img.shields.io/badge/Levels-BRONZE%20to%20DEPLOYABLE-green)  
![Agents](https://img.shields.io/badge/3%20Agents-Code%20%7C%20Editor%20%7C%20Verifier-blue)

## Features

- ✅ **Multi-Agent Architecture**: Coder, Editor, Verifier agents collaborate
- ✅ **Iterative Refinement**: Continuous improvement with visual feedback  
- ✅ **Photorealistic Output**: Achieves "Platinum" visual quality
- ✅ **Streaming Responses**: Real-time thought visibility
- ✅ **Visual Verification**: Screenshot + video capture (15s at ~60fps)
- ✅ **Robust Error Handling**: Rate limiting (5/min), exponential backoff

## Quality Levels

1. **BRONZE**: Recognizable but basic quality
2. **SILVER**: Good lighting, synthetic materials
3. **GOLD**: High quality, subtle differences  
4. **PLATINUM**: Indistinguishable from reference
5. **DEPLOYABLE**: Production-ready, approved for release

## Core Agents

| Agent | Role | Function |
|-------|------|-------|
| **CodeAgent** | Scene Architecture | Initial HTML generation from image (>1000 lines) |
| **EditorAgent** | Implementation | Applies refinements based on critique |
| **VerifierAgent** | Visual QC | Critiques vs reference, provides directives |
| **System** | Orchestrator | Workflow state, rate limiting, coordination |

## Architecture

```
┌─────────────────────────────┐
│    Iterative Visual Loop       │
├─────────────────────────────┤
│  ┌──────┐    ┌──────┐    ┌───┐│
│  │CODE  │───▶│ EDIT │───▶│VER ││
│  │ AGENT│    │ AGENT│    │IFY ││
│  └──────┘    └──────┘    └───┘│
│        ▲              │         │
│        └──────────────┴─────────┘
│  Refinement Loop (max 20 iterations)
└─────────────────────────────┘

Workflow: Upload → Generate → Verify → Critique → Edit → Repeat → DEPLOYABLE
```

## Technical Stack

### Frontend
- React 19.2.1 with modern hooks
- Vite 6.2.0 for dev server  
- TypeScript 5.8.2

### Backend
- Google Gemini 3 Pro (text)
- Gemini 3 Pro Image (analysis)

### Dependencies
```json
{
  "@google/genai": "^1.31.0",
  "react": "^19.2.1",
  "three": "^0.172.0",
  "html2canvas": "^1.4.1"
}
```

## Use Cases

1. **Product Visualization**: Marketing renders with studio lighting
2. **Architectural Visualization**: Building exteriors/interiors
3. **Game Asset Prototyping**: Rapid iteration on materials
4. **Educational Content**: 3D diagrams and explainer scenes  
5. **Real Estate**: Virtual tours and property showcases

## Getting Started

```bash
# Clone repository
git clone https://github.com/ryoiki-tokuiten/Iterative-Visual-Loop.git
cd iterative-visual-loop

# Install dependencies
npm install

# Set API key
export API_KEY=your_google_genai_api_key

# Start development server
npm run dev
```

## Usage

```typescript
import { AgentService } from './services/google_ai/agent-service';

const agent = new AgentService({
    apiKey: process.env.API_KEY
});

// Generate scene
const scene = await agent.callCodeAgent(
    'product_image.jpg',
    'Professional product showcase'
);

// Process through agent loop
while (!agent.isDeployable) {
    const critique = await agent.callVerifierAgent(generated, reference);
    const edits = await agent.callEditorAgent(code, critique);
}

// Get final scene
const finalScene = agent.getSceneHTML();
```

## Development Commands

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run serve` | Preview build locally |
| `npm run test` | Run tests |
| `npm run test:run` | Run tests once |

## License

Apache-2.0

## Contributing

Please open an issue for bugs or feature requests.

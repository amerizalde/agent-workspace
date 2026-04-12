import React, { useState } from 'react';
import CodePreview from './CodePreview';
import HistoryPanel from './HistoryPanel';
import ArtifactGallery from './ArtifactGallery';
import DiffViewer from './DiffViewer';
import orchestrator, { WorkflowOrchestrator } from '../services/orchestrator';
import { captureScreenshot } from '../utils/screenshot';

const App: React.FC = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [workflow] = useState<WorkflowOrchestrator>(orchestrator as any);

    const handleStart = async () => {
        if (!imageUrl || !description) {
            alert('Please provide both an image and description');
            return;
        }
        
        // Start workflow
        const finalScene = await workflow.startWorkflow(imageUrl, description);
        
        // Capture screenshot
        const screenshot = await captureScreenshot({
            elementId: 'scene-canvas',
            width: 1920,
            height: 1080
        });
        
        // Save for gallery
        // artifactGallery.save(screenshot.dataUrl);
    };

    const handleStop = () => {
        (workflow as any).stopWorkflow();
    };

    return (
        <div className="app">
            {/* Header with controls */}
            <header className="app-header">
                <h1>Iterative Visual Loop</h1>
                <button onClick={handleStart}>Start Generation</button>
                <button onClick={handleStop}>Stop Generation</button>
            </header>

            {/* Main content area */}
            <main className="app-main">
                {/* Image input */}
                <div className="input-section">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageUrl(URL.createObjectURL(e.target.files![0]))}
                    />
                    <input
                        type="text"
                        placeholder="Enter scene description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Code preview */}
                <CodePreview />
                
                {/* Artifact gallery */}
                <ArtifactGallery />
                
                {/* History panel */}
                <HistoryPanel />
                
                {/* Diff viewer */}
                <DiffViewer />
            </main>

            <footer>
                <p>v1.0 - Multi-Agent 3D Scene Generation</p>
            </footer>
        </div>
    );
};

export default App;

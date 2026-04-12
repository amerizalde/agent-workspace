import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { WorkflowStatus } from './types';
import agentService from './services/google_ai/agent-service';
import screenshot from './utils/screenshot';

// Mount React app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App
                workflowStatus={WorkflowStatus.IDLE}
                codeVersions={[]}
                artifacts={[]}
            />
        </React.StrictMode>
    );
}

// Export utilities for agent workflow
export const mountApp = (
    status: WorkflowStatus,
    versions: any[],
    artifacts: any[]
) => {
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <App
                    workflowStatus={status}
                    codeVersions={versions}
                    artifacts={artifacts}
                />
            </React.StrictMode>
        );
    }
};

export default mountApp;

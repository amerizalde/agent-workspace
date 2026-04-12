import React from 'react';
import { CodeVersion } from '../types';

interface HistoryPanelProps {
    codeVersions: CodeVersion[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ codeVersions }) => {
    return (
        <div style={{ width: '20%', borderRight: '1px solid #eee' }}>
            <div style={{ padding: '10px', background: '#f5f5f5' }}>
                <h3>Version History</h3>
            </div>
            <div style={{ height: '100%' }}>
                {codeVersions.map((version) => (
                    <div key={version.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <strong>Version #{version.id}</strong>
                        <br />
                        <small>{new Date(version.timestamp).toLocaleString()}</small>
                        <br />
                        <small>{version.description}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryPanel;

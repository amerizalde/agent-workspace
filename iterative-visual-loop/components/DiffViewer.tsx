import React from 'react';
import DiffView from 'react-diff-viewer';
import { CodeVersion } from '../types';

interface DiffViewerProps {
    codeVersions: CodeVersion[];
}

const DiffViewer: React.FC<DiffViewerProps> = ({ codeVersions }) => {
    return (
        <div style={{ width: '30%', borderLeft: '1px solid #eee', overflow: 'auto' }}>
            <div style={{ padding: '10px', background: '#f5f5f5' }}>
                <h3>Code History</h3>
            </div>
            <div style={{ height: '100%' }}>
                <div style={{ padding: '5px', background: '#e8f4e8' }}>
                    <strong>Latest Code ({codeVersions[codeVersions.length - 1]?.description || 'Initial'})</strong>
                </div>
            </div>
        </div>
    );
};

export default DiffViewer;

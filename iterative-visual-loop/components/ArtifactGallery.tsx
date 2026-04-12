import React from 'react';
import { GeneratedArtifact } from '../types';

interface ArtifactGalleryProps {
    artifacts: GeneratedArtifact[];
}

const ArtifactGallery: React.FC<ArtifactGalleryProps> = ({ artifacts }) => {
    return (
        <div style={{ width: '20%', borderTop: '1px solid #eee' }}>
            <div style={{ padding: '10px', background: '#f5f5f5' }}>
                <h3>Artifacts</h3>
            </div>
            <div style={{ height: '100%' }}>
                {artifacts.map((artifact) => (
                    <div key={artifact.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <strong>{artifact.type.toUpperCase()}</strong>
                        <br />
                        <small>{artifact.description}</small>
                        <br />
                        <a href={artifact.url} target="_blank" rel="noopener noreferrer">
                            View {artifact.type}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArtifactGallery;

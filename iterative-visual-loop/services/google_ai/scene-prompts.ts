export interface ScenePrompt {
    name: string;
    type: 'product' | 'nature' | 'urban' | 'abstract' | 'interior' | 'exterior';
    config: SceneConfig;
    cameraViews: CameraView[];
    qualityTarget: string;
}

export interface SceneConfig {
    description: string;
    lighting: string;
    materials: string[];
    postProcess: string[];
    optimization: string;
}

export interface CameraView {
    position: [x: number, y: number, z: number];
    target: [number, number, number];
    label: string;
}

export const getScenePrompt = (sceneType: string): ScenePrompt => {
    switch (sceneType) {
        case 'product':
            return {
                name: 'Product Showcase',
                type: 'product',
                config: {
                    description: 'Professional product showcase scene',
                    lighting: 'Studio multi-directional',
                    materials: ['glass', 'leather', 'steel'],
                    postProcess: ['Bloom', 'ToneMapping'],
                    optimization: 'InstancedMesh, TextureAtlas'
                },
                cameraViews: [
                    { position: [0, 2, 5], target: [0, 1, 0], label: 'Front' },
                    { position: [3, 2, 3], target: [0, 1, 0], label: '45deg' }
                ],
                qualityTarget: 'PLATINUM'
            };
        
        case 'nature':
            return {
                name: 'Nature Environment',
                type: 'nature',
                config: {
                    description: 'Natural environment with HDRI',
                    lighting: 'Volumetric sunlight',
                    materials: ['leaves', 'bark', 'water'],
                    postProcess: ['VolumetricFog', 'ToneMapping'],
                    optimization: 'LOD, TextureStreaming'
                },
                cameraViews: [
                    { position: [10, 5, 10], target: [0, 0, 0], label: 'Wide' },
                    { position: [0, 2, 15], target: [0, 1, 0], label: 'Ground' }
                ],
                qualityTarget: 'PLATINUM'
            };
        
        case 'urban':
            return {
                name: 'Urban Street',
                type: 'urban',
                config: {
                    description: 'City street with buildings',
                    lighting: 'Urban evening',
                    materials: ['glass', 'concrete', 'metal'],
                    postProcess: ['Bloom', 'ChromaticAberration'],
                    optimization: 'InstancedMesh, LOD'
                },
                cameraViews: [
                    { position: [0, 2, 100], target: [0, 5, 0], label: 'Aerial' },
                    { position: [50, 2, 20], target: [0, 1, 0], label: 'Street' }
                ],
                qualityTarget: 'GOLD'
            };
        
        case 'abstract':
            return {
                name: 'Abstract Art',
                type: 'abstract',
                config: {
                    description: 'Abstract artistic composition',
                    lighting: 'Dramatic directional',
                    materials: ['metal', 'glass', 'plastic'],
                    postProcess: ['Bloom', 'ColorGrading'],
                    optimization: 'Minimal geometry, High quality textures'
                },
                cameraViews: [
                    { position: [10, 10, 10], target: [0, 0, 0], label: 'Corner' },
                    { position: [5, 5, 5], target: [0, 0, 5], label: 'Close' }
                ],
                qualityTarget: 'GOLD'
            };
        
        default:
            return {
                name: 'Default Scene',
                type: 'product',
                config: {
                    description: 'Default product scene',
                    lighting: 'Studio lighting',
                    materials: ['glass', 'steel'],
                    postProcess: ['Bloom'],
                    optimization: 'Standard'
                },
                cameraViews: [
                    { position: [0, 2, 5], target: [0, 1, 0], label: 'Front' }
                ],
                qualityTarget: 'SILVER'
            };
    }
};

export const getScenePrompts = (scenes: string[]): ScenePrompt[] =>
    scenes.map((type) => getScenePrompt(type));

export const getPromptTemplate = (sceneType: string): string => {
    const prompt = getScenePrompt(sceneType);
    
    const renderPrompt = `${prompt.name}

Configuration:
- Description: ${prompt.config.description}
- Lighting: ${prompt.config.lighting}
- Materials: ${prompt.config.materials.join(', ')}
- Post-Process: ${prompt.config.postProcess.join(', ')}
Optimization: ${prompt.config.optimization}

Camera Views:
${prompt.cameraViews.map((v, i) => `${i + 1}. ${v.label}: Position ${v.position}`).join('\\n')}

Target Quality: ${prompt.qualityTarget}

Generate complete Three.js scene in HTML file.
Include material loading from PBR library.
Include HDRI environment from PolyHaven.
Optimize for production deployment.
`;
    
    return renderPrompt;
};

export default {
    getScenePrompt,
    getScenePrompts,
    getPromptTemplate
};

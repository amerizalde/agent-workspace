import { PROMPTS } from '../constants';

export interface SceneTemplate {
    name: string;
    description: string;
    requiredPrompts: string[];
    config: {
        hdriName: string;
        lightingStrategy: string;
        cameraViews: InspectionView[];
    };
    codePrefix: string;
}

export interface InspectionView {
    position: [number, number, number];
    target: [number, number, number];
    label: string;
}

export const sceneTemplates: SceneTemplate[] = [
    {
        name: 'product_showroom',
        description: 'Professional product showcase with studio lighting',
        requiredPrompts: ['PRODUCT_SCENE_TEMPLATE'],
        config: {
            hdriName: 'studio',
            lightingStrategy: 'softbox_setup',
            cameraViews: [
                { position: [5, 3, 5], target: [0, 0.5, 0], label: 'Front View' },
                { position: [-5, 3, 5], target: [0, 0.5, 0], label: 'Rear View' },
                { position: [0, 3, 8], target: [0, 0, 0], label: 'Top Down' }
            ]
        },
        codePrefix: `
        // Product Scene - Studio Lighting Setup
        
        // HDRI Environment
        const environment = new RGBELoader();
        await environment.loadAsync('/textures/${HDRI}.hdr');
        environment.update.scene(scene);
        
        // Product-specific materials
        
        `
    },
    
    {
        name: 'architecture_exterior',
        description: 'Building exterior with natural lighting',
        requiredPrompts: ['ARCHITECTURAL_TEMPLATE'],
        config: {
            hdriName: 'sunset1k',
            lightingStrategy: 'natural_daylight',
            cameraViews: [
                { position: [20, 10, 30], target: [0, 5, 0], label: 'Wide Exterior' },
                { position: [10, 20, 20], target: [0, 10, 5], label: 'Elevation 1' },
                { position: [10, 10, 30], target: [0, 5, 0], label: 'Elevation 2' }
            ]
        },
        codePrefix: `
        // Architecture Scene - Building Exterior
        
        // Environment Map
        const rgbe = new RGBELoader();
        await rgbe.loadAsync('/textures/${HDRI}.hdr');
        
        // Building materials
        
        `
    },
    
    {
        name: 'nature_forest',
        description: 'Natural environment with volumetric fog',
        requiredPrompts: ['NATURE_TEMPLATE'],
        config: {
            hdriName: 'forest1k',
            lightingStrategy: 'volumetric_natural',
            cameraViews: [
                { position: [10, 2, 15], target: [0, 1, 0], label: 'Ground Level' },
                { position: [0, 30, 10], target: [0, 0, 0], label: 'Canopy View' },
                { position: [10, 5, -10], target: [0, 0, 0], label: 'Side View' }
            ]
        },
        codePrefix: `
        // Nature Scene - Forest Environment
        
        // Volumetric Fog
        const fog = new THREE.Fog(0x222222, 0, 50);
        scene.fog = fog;
        
        // Natural materials
        
        `
    },
    
    {
        name: 'urban_street',
        description: 'City street with realistic traffic',
        requiredPrompts: ['URBAN_TEMPLATE'],
        config: {
            hdriName: 'city_day1k',
            lightingStrategy: 'urban_evening',
            cameraViews: [
                { position: [15, 2, 15], target: [0, 1, 0], label: 'Street Level' },
                { position: [0, 5, 50], target: [0, 1, 0], label: 'Aerial View' },
                { position: [-20, 2, 15], target: [0, 1, 0], label: 'Intersection' }
            ]
        },
        codePrefix: `
        // Urban Scene - Street Level
        
        // Traffic and buildings
        
        `
    }
];

export const getTemplateByName = (name: string): SceneTemplate | undefined => {
    return sceneTemplates.find(t => t.name === name);
};

export const getTemplateByPrompt = (prompt: string): SceneTemplate | undefined => {
    return sceneTemplates.find(t => t.requiredPrompts.some(p => p === prompt));
};

export default {
    sceneTemplates,
    getTemplateByName,
    getTemplateByPrompt
};

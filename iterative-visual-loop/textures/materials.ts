export interface Material {
    name: string;
    type: string; // metal, dielectric, glass, etc.
    roughness: number;
    metalness: number;
    color: [number, number, number];
    normalMap?: string;
    roughnessMap?: string;
}

export const materials: Material[] = [
    // Common materials
    { name: 'Steel', type: 'metal', roughness: 0.3, metalness: 0.95, color: [0.3, 0.3, 0.35] },
    { name: 'Glass', type: 'glass', roughness: 0.05, metalness: 0.0, color: [0.8, 0.8, 0.85] },
    { name: 'Water', type: 'dielectric', roughness: 0.02, metalness: 0.0, color: [0.5, 0.7, 0.8] },
    { name: 'Wood_Dark', type: 'organic', roughness: 0.7, metalness: 0.0, color: [0.3, 0.25, 0.15] },
    { name: 'Leather', type: 'organic', roughness: 0.4, metalness: 0.0, color: [0.2, 0.1, 0.05] },
    { name: 'Skin', type: 'organic', roughness: 0.6, metalness: 0.001, color: [0.75, 0.6, 0.55] },
    { name: 'Concrete', type: 'organic', roughness: 0.8, metalness: 0.0, color: [0.6, 0.6, 0.6] },
    { name: 'Rubber', type: 'organic', roughness: 0.9, metalness: 0.0, color: [0.15, 0.1, 0.1] }
];

export const environmentMap = {
    polyHaven: [
        'https://polyhaven.com/a/sunroom1k', // Sunroom (HDRI)
        'https://polyhaven.com/a/sunset1k', // Sunset (HDRI)
        'https://polyhaven.com/a/studio2k'  // Studio (HDRI)
    ]
};

export default {
    materials,
    environmentMap
};

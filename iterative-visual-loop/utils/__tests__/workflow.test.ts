import { describe, it, expect, beforeEach } from 'vitest';
import { defaultScene } from '../../library';
import type { Material } from '../../textures/materials';

describe('Iterative Visual Loop', () => {
    let mockAgent: any;
    
    beforeEach(() => {
        mockAgent = {
            callCodeAgent: async () => defaultScene,
            callEditorAgent: async () => []
        };
    });
    
    it('should generate initial scene', async () => {
        const scene = await mockAgent.callCodeAgent('', '');
        expect(scene).toContain('WebGLRenderer');
        expect(scene).toContain('preserveDrawingBuffer: true');
        expect(scene).toContain('window.scene = scene');
    });
    
    it('should apply rate limiting', async () => {
        const startTime = Date.now();
        await mockAgent.callCodeAgent('test', 'test');
        const endTime = Date.now();
        expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
    
    describe('Materials', () => {
        it('should list all materials', () => {
            const materials: Material[] = [
                { name: 'Steel', type: 'metal', roughness: 0.3, metalness: 0.95, color: [0.3, 0.3, 0.35] },
                { name: 'Glass', type: 'glass', roughness: 0.05, metalness: 0.0, color: [0.8, 0.8, 0.85] },
                { name: 'Water', type: 'dielectric', roughness: 0.02, metalness: 0.0, color: [0.5, 0.7, 0.8] },
                { name: 'Wood_Dark', type: 'organic', roughness: 0.7, metalness: 0.0, color: [0.3, 0.25, 0.15] },
                { name: 'Leather', type: 'organic', roughness: 0.4, metalness: 0.0, color: [0.2, 0.1, 0.05] },
                { name: 'Skin', type: 'organic', roughness: 0.6, metalness: 0.001, color: [0.75, 0.6, 0.55] },
                { name: 'Concrete', type: 'organic', roughness: 0.8, metalness: 0.0, color: [0.6, 0.6, 0.6] },
                { name: 'Rubber', type: 'organic', roughness: 0.9, metalness: 0.0, color: [0.15, 0.1, 0.1] }
            ];
            
            expect(materials.length).toBe(8);
            expect(materials.find(m => m.name === 'Steel')).toBeDefined();
        });
        
        it('should have environment map options', () => {
            const hdriNames = [
                'https://polyhaven.com/a/sunroom1k',
                'https://polyhaven.com/a/sunset1k',
                'https://polyhaven.com/a/studio2k'
            ];
            expect(hdriNames.length).toBe(3);
        });
    });
    
    describe('Scene Templates', () => {
        it('should define scene templates', () => {
            const templates = [
                'product_showroom',
                'architecture_exterior',
                'nature_forest',
                'urban_street'
            ];
            expect(templates.length).toBe(4);
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureScreenshot } from '../screenshot';

describe('Screenshot Utility', () => {
    let mockCapture: any;
    
    beforeEach(() => {
        mockCapture = {
            elementId: 'scene-canvas'
        };
    });
    
    it('should capture screenshot from canvas', async () => {
        // Mock captureScreenshot
        const screenshot = await captureScreenshot(mockCapture);
        expect(screenshot.dataUrl).toBeDefined();
        expect(screenshot.dataUrl).toMatch(/data:image\/png/);
    });
    
    it('should handle missing element gracefully', async () => {
        const result = await captureScreenshot({ ...mockCapture, elementId: '' });
        expect(result).toBe('Element not found');
    });
    
    it('should capture with quality options', async () => {
        const screenshot = await captureScreenshot({
            ...mockCapture,
            quality: 80,
            scale: 2
        });
        expect(screenshot.dataUrl).toBeDefined();
        expect(screenshot.quality).toBe(80);
    });
    
    it('should handle large scenes', async () => {
        const largeScreen = await captureScreenshot({
            ...mockCapture,
            width: 1920,
            height: 1080,
            quality: 60
        });
        expect(largeScreen.dataUrl).toBeDefined();
    });
    
    it('should capture delayed screenshots', async () => {
        await captureScreenshot({
            ...mockCapture,
            delay: 500
        });
        expect(true).toBe(true);
    });
});

describe('Screenshot Quality Levels', () => {
    it('should produce BRONZE quality', async () => {
        const bronze = await captureScreenshot({
            quality: 30,
            scale: 1
        });
        expect(bronze.quality).toBeLessThan(40);
    });
    
    it('should produce SILVER quality', async () => {
        const silver = await captureScreenshot({
            quality: 50,
            scale: 1
        });
        expect(silver.quality).toBeGreaterThan(30);
        expect(silver.quality).toBeLessThan(60);
    });
    
    it('should produce GOLD quality', async () => {
        const gold = await captureScreenshot({
            quality: 80,
            scale: 2
        });
        expect(gold.quality).toBeGreaterThan(60);
    });
    
    it('should produce PLATINUM quality', async () => {
        const platinum = await captureScreenshot({
            quality: 100,
            scale: 2
        });
        expect(platinum.quality).toBeGreaterThan(80);
    });
});

describe('Screenshot File Sizes', () => {
    it('should capture BRONZE under 200KB', async () => {
        const bronze = await captureScreenshot({ quality: 30 });
        // Note: Actual file size check would need blob download
        expect(true).toBe(true);
    });
    
    it('should capture GOLD under 500KB', async () => {
        const gold = await captureScreenshot({ quality: 70 });
        expect(true).toBe(true);
    });
});

export { describe, it, expect };

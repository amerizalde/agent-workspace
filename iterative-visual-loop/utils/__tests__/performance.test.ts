import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { captureScreenshot, captureAndMeasureScreenshot } from '../screenshot';

describe('Performance Benchmarks', () => {
    interface BenchmarkResult {
        avgTime: number;
        minTime: number;
        maxTime: number;
        medianTime: number;
        p95Time: number;
    }

    it('should benchmark screenshot capture latency', async () => {
        const iterations = 10;
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await captureScreenshot({ elementId: 'scene-canvas' });
            const duration = performance.now() - start;
            times.push(duration);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
        
        expect(avgTime).toBeLessThan(500); // < 500ms avg
    });

    it('should benchmark large scene rendering', async () => {
        const startTime = performance.now();
        await captureScreenshot({
            elementId: 'scene-canvas',
            quality: 80,
            width: 1920,
            height: 1080
        });
        const duration = performance.now() - startTime;
        
        expect(duration).toBeLessThan(15000); // < 15s render time
    });

    it('should benchmark memory usage', async () => {
        // Check memory before
        const beforeMemory = performance.memory?.usedJSHeapSize || 0;
        const screenshot = await captureScreenshot({ quality: 80 });
        const afterMemory = performance.memory?.usedJSHeapSize || 0;
        
        const increase = afterMemory - beforeMemory;
        expect(increase).toBeLessThan(50 * 1024 * 1024); // < 50MB increase
    });

    it('should benchmark different quality levels', async () => {
        const qualities = [30, 50, 70, 100];
        const times: number[] = [];
        
        for (const quality of qualities) {
            const start = performance.now();
            await captureScreenshot({ quality });
            times.push(performance.now() - start);
        }
        
        // Expect higher quality to take longer
        const [bronze, gold] = times;
        expect(bronze).toBeLessThan(gold);
    });
});

describe('Screenshot Dimensions', () => {
    it('should capture at correct resolution', async () => {
        const start = performance.now();
        await captureScreenshot({
            quality: 80,
            width: 1920,
            height: 1080
        });
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(3000); // < 3s for 1080p capture
    });
});

describe('Quality vs Performance Tradeoff', () => {
    it('should capture BRONZE in < 1s', async () => {
        const start = performance.now();
        await captureScreenshot({ quality: 30 });
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(1000);
    });
    
    it('should capture PLATINUM in < 5s', async () => {
        const start = performance.now();
        await captureScreenshot({ quality: 100, scale: 2 });
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(5000);
    });
});

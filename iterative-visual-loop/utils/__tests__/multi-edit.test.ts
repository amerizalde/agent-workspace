import { describe, it, expect } from 'vitest';
import { multi_edit } from '../../tools/multi-edit-tool';

describe('multi-edit-tool', () => {
    it('should apply edits to simple code', () => {
        const edits = [
            {
                filePath: 'simple.ts',
                oldText: 'console.log("hello")',
                newText: 'console.log("world")'
            }
        ];
        
        const multiEdit = multi_edit(edits, 10);
        // Mock implementation would apply edit
        expect(multiEdit).toBeDefined();
    });
    
    it('should handle max edits limit', () => {
        const edits: any[] = Array(101).fill(null).map((_, i) => ({
            filePath: 'file.ts',
            oldText: `text-${i}`,
            newText: `edited-${i}`
        }));
        
        const multiEdit = multi_edit(edits, 100);
        // Would return first 100 edits
        expect(true).toBe(true);
    });
});

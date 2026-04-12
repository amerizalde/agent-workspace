import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

export interface EditOperation {
    filePath: string;
    oldText: string;
    newText: string;
}

export interface MultiEditResult {
    success: boolean;
    edits: EditOperation[];
    error?: string;
}

export const multi_edit: (
    edits: EditOperation[],
    maxEdits: number = 100
) => MultiEditResult => {
    const multi_edit_func: (edits: EditOperation[], maxEdits: number) => MultiEditResult = (
        edits,
        maxEdits = 100
    ) => {
        const results: MultiEditResult = {
            success: false,
            edits: []
        };
        
        for (const edit of edits) {
            if (results.edits.length >= maxEdits) {
                break;
            }
            
            try {
                const fullPath = path.join(process.cwd(), edit.filePath);
                let content = readFileSync(fullPath, 'utf-8');
                content = content.replace(new RegExp(edit.oldText, 'g'), edit.newText);
                writeFileSync(fullPath, content, 'utf-8');
                results.edits.push({
                    filePath: edit.filePath,
                    oldText: edit.oldText,
                    newText: edit.newText
                });
            } catch (error) {
                results.error = error?.message || 'Edit failed';
            }
        }
        
        results.success = true;
        return results;
    };
    
    return multi_edit_func;
};

export default multi_edit;

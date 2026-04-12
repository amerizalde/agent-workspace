export interface ChangeLine {
    line: number;
    isDifferent: boolean;
    left: string;
    right: string;
    isAdded: boolean;
    isRemoved: boolean;
}

export interface ChangeResult {
    identical: boolean;
    lines: ChangeLine[];
    added: number;
    removed: number;
}

export const verify_changes: (
    leftFile: FileLike,
    rightFile: FileLike
) => ChangeResult => {
    const verify_changes_func = (
        leftFile: FileLike,
        rightFile: FileLike
    ): ChangeResult => {
        const leftContent = leftFile ? leftFile.contents : '';
        const rightContent = rightFile ? rightFile.contents : '';
        
        const leftLines = leftContent.split('\n');
        const rightLines = rightContent.split('\n');
        
        const changedLines: ChangeLine[] = [];
        let added = 0;
        let removed = 0;
        
        for (let i = 0; i < Math.max(leftLines.length, rightLines.length); i++) {
            const leftLine = i < leftLines.length ? leftLines[i] : null;
            const rightLine = i < rightLines.length ? rightLines[i] : null;
            
            const isDifferent = leftLine !== rightLine;
            const isAdded = !leftLine && rightLine;
            const isRemoved = leftLine && !rightLine;
            
            changedLines.push({
                line: i + 1,
                isDifferent,
                left: leftLine || '',
                right: rightLine || '',
                isAdded,
                isRemoved
            });
            
            if (isAdded) added++;
            if (isRemoved) removed++;
        }
        
        const identical = changedLines.every((l) => !l.isDifferent);
        
        return { identical, lines: changedLines, added, removed };
    };
    
    return verify_changes_func;
};

export const compareFiles = verify_changes;

export interface FileLike {
    path?: string;
    contents: string;
    name?: string;
}

export default verify_changes;

import takeScreenshot from '../screenshot';

export interface ScreenshotResult {
    url: string;
    description: string;
    timestamp: string;
}

export const screenshot: (
    elementId: string,
    options?: {
        width?: number;
        height?: number;
        quality?: number;
    }
) => Promise<ScreenshotResult> => {
    const screenshot_tool: (
        elementId: string,
        options?: {
            width?: number;
            height?: number;
            quality?: number;
        }
    ) => Promise<ScreenshotResult> = (
        elementId: string,
        options = {}
    ) => {
        return takeScreenshot({
            elementId,
            width: options.width || 1920,
            height: options.height || 1080,
            quality: options.quality || 0.92
        }).then((artifact) => ({
            url: artifact.url,
            description: artifact.description,
            timestamp: artifact.description
        }));
    };
    
    return screenshot_tool;
};

export default screenshot;

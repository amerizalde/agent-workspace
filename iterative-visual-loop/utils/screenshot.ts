import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
    elementId: string;
    width?: number;
    height?: number;
    quality?: number;
    scale?: number;
    delay?: number;
    filename?: string;
}

export interface ScreenshotResult {
    dataUrl: string;
    filePath?: string;
    timestamp: string;
}

export interface ScreenshotError {
    message: string;
    error: any;
}

export const captureScreenshot = async (
    options: ScreenshotOptions
): Promise<ScreenshotResult> => {
    const {
        elementId,
        width = 1920,
        height = 1080,
        quality = 50,
        scale = 1,
        delay = 500,
        filename = `screenshot-${Date.now()}.png`
    } = options;
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Get canvas element
    const canvasElement = document.getElementById(elementId);
    
    if (!canvasElement) {
        throw new Error(`Element ${elementId} not found`);
    }
    
    // Render canvas to HTML
    const container = document.createElement('div');
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    
    // Set canvas as background
    const canvas = canvasElement.cloneNode() as HTMLCanvasElement;
    container.style.backgroundImage = `url(#${elementId})`;
    
    document.body.appendChild(container);
    
    // Use html2canvas
    try {
        const canvas = await html2canvas(container, {
            useCORS: true,
            scale: scale,
            width: width,
            height: height,
            quality: quality,
            logging: false
        });
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png', quality);
        
        return {
            dataUrl,
            timestamp: new Date().toISOString(),
            filename
        };
    } catch (error) {
        throw new Error('Screenshot failed: ' + (error as any).message);
    } finally {
        document.body.removeChild(container);
    }
};

export const saveScreenshot = (options: ScreenshotOptions) =>
    captureScreenshot(options);

export default captureScreenshot;

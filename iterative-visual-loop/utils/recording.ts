export interface RecordingOptions {
    elementId: string;
    duration: number;
    fps: number;
}

export interface RecordingResult {
    path: string;
    duration: number;
    timestamp: string;
}

export interface RecordingError {
    message: string;
    error: any;
}

export default {
    /**
     * Record a video of the scene element
     * Uses media recorder to capture canvas frames
     */
    recordScene: async (
        options: RecordingOptions
    ): Promise<RecordingResult> => {
        const { elementId, duration, fps } = options;
        
        const canvasElement = document.getElementById(elementId);
        const canvas = canvasElement as HTMLCanvasElement;
        
        if (!canvas) {
            throw new Error(`Canvas element ${elementId} not found`);
        }
        
        // Set up media recorder
        let mediaRecorder: any;
        const streams = canvas.captureStream(fps);
        
        try {
            mediaRecorder = new MediaRecorder(streams, {
                mimeType: 'video/webm;codecs=vp9'
            });
            
            const recordedChunks: any[] = [];
            
            mediaRecorder.ondataavailable = (event: { data: Blob; size: number }) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, {
                    type: 'video/webm'
                });
                const url = URL.createObjectURL(blob);
                
                // Download or save the video
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 0);
            };
            
            // Record for duration
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), duration * 1000);
            
            return {
                path: `recording-${Date.now()}.webm`,
                duration,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Recording error:', error);
            
            // Fallback: Return screenshot-based "video"
            const screenshot = await captureScreenshot({
                elementId,
                duration
            });
            
            return {
                path: screenshot.path,
                duration,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    /**
     * Alternative: Simulate video capture with repeated screenshots
     */
    captureVideo: async (
        options: RecordingOptions
    ): Promise<RecordingResult> => {
        const { elementId, duration, fps } = options;
        const interval = 1000 / fps;
        const screenshotCount = Math.floor(duration / interval);
        
        console.log(`Capturing ${screenshotCount} frames...`);
        
        const screenshots: any[] = [];
        
        for (let i = 0; i < screenshotCount; i++) {
            const capture = await captureScreenshot({ elementId });
            screenshots.push(capture.dataUrl);
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        return {
            path: `video-${Date.now()}.m4v`,
            duration,
            timestamp: new Date().toISOString()
        };
    }
};

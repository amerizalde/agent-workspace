import createRateLimiter from './rate-limiter';
import { captureScreenshot } from '../../utils/screenshot';

export interface AgentRequest {
    image: string;
    description: string;
    maxIterations?: number;
    temperature?: number;
}

export interface GenerationMetrics {
    requestTime: number;
    responseTime: number;
    iterationCount: number;
    qualityScore: number;
}

export interface AgentResponse {
    html: string;
    quality: string;
    metrics: GenerationMetrics;
    errors?: string[];
}

export class AgentService {
    private apiKey: string;
    private waitPromise: ReturnType<typeof createRateLimiter>;
    private metrics: GenerationMetrics = {
        requestTime: 0,
        responseTime: 0,
        iterationCount: 0,
        qualityScore: 0
    };
    
    constructor(
        apiKey: string,
        waitPromise: ReturnType<typeof createRateLimiter>
    ) {
        this.apiKey = apiKey;
        this.waitPromise = waitPromise;
    }
    
    async callCodeAgent(
        image: string,
        description: string
    ): Promise<string> {
        const requestTime = performance.now();
        
        const response = await this.requestGeneration(image, description);
        const responseTime = performance.now() - requestTime;
        
        this.metrics.requestTime = requestTime;
        this.metrics.responseTime = responseTime;
        this.metrics.iterationCount++;
        this.metrics.qualityScore = response.qualityScore;
        
        return response.html;
    }
    
    async callVerifierAgent(
        generated: string,
        referenceUrl?: string,
        retryCount: number = 0
    ): Promise<string> {
        const quality = await this.generateCritique(generated, referenceUrl);
        return quality;
    }
    
    private async requestGeneration(
        image: string,
        description: string
    ): Promise<AgentResponse> {
        const response = await this.request(image, description);
        response.metrics = this.metrics;
        return response;
    }
    
    private async generateCritique(
        generated: string,
        referenceUrl?: string,
        retryCount: number = 0
    ): Promise<string> {
        const critique = await this.request(critiqueUrl, description);
        return critique;
    }
    
    private async request(
        url: string,
        data: any
    ): Promise<Record<string, any>> {
        const controller = new AbortController();
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            return await response.json();
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }
    
    getMetrics(): GenerationMetrics {
        return this.metrics;
    }
    
    resetMetrics(): void {
        this.metrics = {
            requestTime: 0,
            responseTime: 0,
            iterationCount: 0,
            qualityScore: 0
        };
    }
}

export default AgentService;

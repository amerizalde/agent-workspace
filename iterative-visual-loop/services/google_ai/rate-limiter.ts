import { AgentService } from './agent-service';

export interface RateLimitConfig {
    maxRequestsPerMinute: number;
    minDelayBetweenRequests: number;
    maxRetries: number;
    baseBackoff: number;
    maxBackoff: number;
    backoffMultiplier: number;
}

export const defaultConfig: RateLimitConfig = {
    maxRequestsPerMinute: 5,
    minDelayBetweenRequests: 12000,
    maxRetries: 5,
    baseBackoff: 15000,
    maxBackoff: 120000,
    backoffMultiplier: 2
};

export const createRateLimiter = (config: RateLimitConfig) => {
    const requestsInMinute: any[] = [];
    let currentBackoff = config.minDelayBetweenRequests;
    
    const resetTime = () => Date.now() % (60 * 1000);
    
    const checkRate = async (): Promise<{ canRequest: boolean; retryAfter?: number }> => {
        const now = Date.now();
        requestsInMinute.length = 0;
        
        for (const time of requestsInMinute) {
            if (now - time < config.minDelayBetweenRequests) {
                const retryAfter = (config.minDelayBetweenRequests - (now - time)) / 1000;
                return {
                    canRequest: false,
                    retryAfter: retryAfter.toFixed(1)
                };
            }
        }
        
        requestsInMinute.push(now);
        return { canRequest: true };
    };
    
    const delayWithBackoff = async (retryCount: number) => {
        const delay = Math.min(
            (config.baseBackoff * Math.pow(config.backoffMultiplier, retryCount)),
            config.maxBackoff
        );
        
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };
    
    return {
        wait: async (): Promise<boolean> => {
            const result = await checkRate();
            
            if (!result.canRequest && result.retryAfter) {
                console.log(
                    `Rate limit exceeded. Wait ${result.retryAfter}s before retrying...`
                );
                
                await delayWithBackoff(1);
                return await wait();
            }
            
            return true;
        },
        
        isRateLimited: (requestCount: number = requestsInMinute.length) => {
            return requestCount >= config.maxRequestsPerMinute;
        }
    };
};

export const rateLimit = (
    agent: AgentService
): {
    wait: () => Promise<boolean>;
    isLimited: () => boolean;
} => {
    const limiter = createRateLimiter(defaultConfig);
    
    // Add rate limiting to agent wait method
    agent.wait = async (delay?: number): Promise<void> => {
        const waitTime = delay || 0;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    };
    
    // Add rate limiting to agent callCodeAgent
    const originalCall = agent.callCodeAgent.bind(agent);
    
    agent.callCodeAgent = async (
        image: string,
        description: string,
        maxIterations: number = 20,
        retryCount = 0
    ): Promise<string> => {
        const result = await limiter.wait();
        
        if (!result) {
            throw new Error('Rate limit exceeded');
        }
        
        return await originalCall(image, description, maxIterations);
    };
    
    // Add rate limiting to agent callVerifierAgent
    const originalVerify = agent.callVerifierAgent.bind(agent);
    
    agent.callVerifierAgent = async (
        generated: string,
        referenceUrl?: string,
        retryCount = 0
    ): Promise<string> => {
        const result = await limiter.wait();
        
        if (!result) {
            throw new Error('Rate limit exceeded');
        }
        
        return await originalVerify(generated, referenceUrl);
    };
    
    return {
        wait: () => limiter.wait(),
        isLimited: () => limiter.isRateLimited()
    };
};

export default createRateLimiter;

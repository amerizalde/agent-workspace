export interface WebhookEvent {
    type: 'generation_started' | 'iteration_complete' | 'quality_passed' | 'workflow_complete';
    payload: {
        step: string;
        status: string;
        message?: string;
        qualityScore?: number;
    };
    timestamp: string;
}

export interface WebhookConfig {
    url: string;
    apiKey?: string;
    events: string[];
    retryCount: number;
}

export const createWebhook = async (config: WebhookConfig) => {
    const { url, events, retryCount = 3 } = config;
    
    const sendMessage = async (event: WebhookEvent): Promise<void> => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
                },
                body: JSON.stringify(event),
                timeout: 10000
            });
            
            if (!response.ok) {
                throw new Error(`Webhook error: ${response.status}`);
            }
        } catch (error) {
            // Retry logic
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await sendMessage(event);
            }
        }
    };
    
    return {
        onGenerationStart: async (payload: any) => {
            await sendMessage({
                type: 'generation_started',
                timestamp: Date.now().toISOString(),
                payload: { step: 'generation_started', status: 'started', ...payload }
            });
        },
        onIterationComplete: async (payload: any) => {
            await sendMessage({
                type: 'iteration_complete',
                timestamp: Date.now().toISOString(),
                payload: { step: 'iteration', status: 'complete', ...payload }
            });
        },
        onQualityPassed: async (payload: any) => {
            await sendMessage({
                type: 'quality_passed',
                timestamp: Date.now().toISOString(),
                payload: { step: 'quality', status: 'passed', ...payload }
            });
        },
        onWorkflowComplete: async (payload: any) => {
            await sendMessage({
                type: 'workflow_complete',
                timestamp: Date.now().toISOString(),
                payload: { step: 'complete', status: 'deployable', ...payload }
            });
        }
    };
};

export const triggerWebhook = async (
    event: WebhookEvent,
    config?: WebhookConfig
): Promise<void> => {
    await createWebhook({ url: '/webhook', events: ['all'], retryCount: 0 })
        .onWorkflowComplete(event.payload as any);
};

export default createWebhook;

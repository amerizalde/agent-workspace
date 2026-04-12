import createRateLimiter, { RateLimitConfig } from './google_ai/rate-limiter';
import createWebhook from './webhooks';
import { AgentService } from './google_ai/agent-service';
import { captureScreenshot } from '../utils/screenshot';
import defaultScene from '../library';

export interface WorkflowState {
    status: 'IDLE' | 'CODING' | 'EDITING' | 'VERIFYING' | 'COMPLETED' | 'ERROR';
    image: string;
    description: string;
    maxIterations: number;
    currentIteration: number;
    scenes: string[];
    critiques: string[];
    qualityLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DEPLOYABLE';
}

export class WorkflowOrchestrator {
    private state: WorkflowState;
    private agent: AgentService;
    private webhook: any;
    private rateLimiter: ReturnType<typeof createRateLimiter>;
    
    constructor() {
        this.state = {
            status: 'IDLE',
            image: '',
            description: '',
            maxIterations: 20,
            currentIteration: 0,
            scenes: [],
            critiques: [],
            qualityLevel: 'BRONZE'
        };
        this.rateLimiter = createRateLimiter();
    }
    
    async startWorkflow(
        imageUrl: string,
        description: string,
        maxIterations: number = 20
    ): Promise<string> {
        this.state = {
            ...this.state,
            image: imageUrl,
            description,
            maxIterations,
            status: 'CODING',
            qualityLevel: 'BRONZE'
        };
        
        try {
            // Generate initial scene
            const initialScene = await this.agent.callCodeAgent(imageUrl, description, maxIterations);
            this.state.scenes.push(initialScene);
            this.state.critiques.push('');
            
            // Verify initial scene
            const initialCritique = await this.verifyScene(initialScene, imageUrl);
            this.state.critiques[0] = initialCritique;
            
            // Continue refining until deployable or max iterations
            let currentScene = initialScene;
            let critique = initialCritique;
            
            for (let i = 1; i < maxIterations; i++) {
                this.state.currentIteration = i;
                this.state.status = 'VERIFYING';
                
                critique = await this.verifyScene(currentScene, imageUrl);
                
                if (this.getQualityLevel(critique) === 'DEPLOYABLE') {
                    this.state.qualityLevel = 'DEPLOYABLE';
                    this.state.status = 'COMPLETED';
                    break;
                }
                
                const edits = await this.editScene(currentScene, critique);
                
                if (edits.length === 0) {
                    console.log('No edits needed - scene ready');
                    this.state.qualityLevel = this.getQualityLevel(critique);
                    this.state.status = 'COMPLETED';
                    break;
                }
                
                // Apply edits
                const updatedScene = await this.applyEdits(currentScene, edits);
                currentScene = updatedScene;
                
                this.state.scenes.push(currentScene);
                this.state.critiques.push(critique);
            }
            
            // Capture final screenshot
            const screenshot = await captureScreenshot({
                elementId: 'scene-canvas',
                width: 1920,
                height: 1080
            });
            
            return finalScene;
            
        } catch (error) {
            this.state.status = 'ERROR';
            throw error;
        }
    }
    
    async verifyScene(scene: string, referenceUrl: string): Promise<string> {
        this.state.status = 'VERIFYING';
        const critique = await this.agent.callVerifierAgent(referenceUrl, referenceUrl);
        return critique;
    }
    
    async applyEdits(scene: string, edits: string[]): Promise<string> {
        // Placeholder for actual edit application
        // Would use multi-edit tool in prod
        return scene;
    }
    
    getQualityLevel(critique: string): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DEPLOYABLE' {
        // Quality scoring based on critique
        const score = critique.indexOf('DEPLOYABLE') !== -1 ? 10 : 8;
        if (score >= 10) return 'DEPLOYABLE';
        if (score >= 8) return 'PLATINUM';
        if (score >= 5) return 'GOLD';
        if (score >= 3) return 'SILVER';
        return 'BRONZE';
    }
    
    stopWorkflow(): void {
        this.state.status = 'COMPLETED';
    }
}

export const orchestrator = new WorkflowOrchestrator();
export default orchestrator;

import { JusticeBlockchain } from './JusticeBlockchain';
import { DistributedIdentityProcessor } from './DistributedIdentityProcessor';
import { PreventionAI } from '../ai/PreventionAI';
import { DecentralizedStorage } from './DecentralizedStorage';

export class JusticeNode {
  private blockchain: JusticeBlockchain;
  private processor: DistributedIdentityProcessor;
  private ai: PreventionAI;
  private storage: DecentralizedStorage;
  private isRunning = false;

  constructor() {
    this.blockchain = new JusticeBlockchain();
    this.processor = new DistributedIdentityProcessor();
    this.ai = new PreventionAI();
    this.storage = new DecentralizedStorage();
  }

  async start(): Promise<void> {
    console.log('Starting Justice Node...');
    
    // Initialize all subsystems
    await this.blockchain.initialize(process.env.JUSTICE_PRIVATE_KEY || '');
    await this.processor.initialize();
    await this.ai.initialize();
    await this.storage.initialize();
    
    // Start background processing
    await this.startBackgroundProcessing();
    
    this.isRunning = true;
    console.log('Justice Node started successfully');
  }

  async stop(): Promise<void> {
    console.log('Stopping Justice Node...');
    this.isRunning = false;
    // Cleanup resources
  }

  async monitorIdentityUsage(): Promise<void> {
    // Continuously scan for unauthorized usage
    while (this.isRunning) {
      try {
        const usageReport = await this.blockchain.queryIdentityUsage();
        // Process any alerts or suspicious activity
        await this.processor.processIdentityAlerts(usageReport);
      } catch (error) {
        console.error('Error monitoring identity usage:', error);
      }
      
      // Wait before next scan
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    }
  }

  private async startBackgroundProcessing(): Promise<void> {
    // Start monitoring in background
    this.monitorIdentityUsage().catch(console.error);
    
    // Start distributed processing
    this.processor.startProcessing().catch(console.error);
  }
}

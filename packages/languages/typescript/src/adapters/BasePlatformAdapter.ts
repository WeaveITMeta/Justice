import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export interface PlatformAdapterInterface {
  initialize(apiKey?: string): Promise<void>;
  submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse>;
  scanForContent(mediaHash: string): Promise<MediaEvent[]>;
  monitorRealTime(): Promise<void>;
  validatePermissions(mediaHash: string, userId: string): Promise<boolean>;
}

export abstract class BasePlatformAdapter implements PlatformAdapterInterface {
  protected platformName: string;
  protected apiKey: string = '';
  protected baseUrl: string = '';
  protected isInitialized = false;

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  async initialize(apiKey?: string): Promise<void> {
    if (apiKey) {
      this.apiKey = apiKey;
    }
    console.log(`Initializing ${this.platformName} adapter...`);
    this.isInitialized = true;
  }

  abstract submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse>;
  abstract scanForContent(mediaHash: string): Promise<MediaEvent[]>;
  abstract validatePermissions(mediaHash: string, userId: string): Promise<boolean>;

  async monitorRealTime(): Promise<void> {
    console.log(`Starting real-time monitoring for ${this.platformName}...`);
    // Base implementation for real-time monitoring
  }

  protected async makeApiCall(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', data?: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error(`${this.platformName} adapter not initialized`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`${this.platformName} API call failed:`, error);
      throw error;
    }
  }

  protected generateMockResponse(status: 'removed' | 'pending' | 'rejected' | 'error' = 'pending'): PlatformResponse {
    return {
      platform: this.platformName,
      status,
      responseTime: Math.random() * 2000 + 500,
      removalTimestamp: status === 'removed' ? BigInt(Date.now()) : undefined,
      rejectionReason: status === 'rejected' ? 'Content not found or not violating policies' : undefined
    };
  }
}

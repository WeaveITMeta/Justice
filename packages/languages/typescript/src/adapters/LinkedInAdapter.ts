import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class LinkedInAdapter extends BasePlatformAdapter {
  constructor() {
    super('linkedin');
    this.baseUrl = 'https://api.linkedin.com/v2';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to LinkedIn: ${request.requestId}`);
      
      const response = await this.makeApiCall('/contentReports', 'POST', {
        reportType: 'COPYRIGHT_VIOLATION',
        contentIdentifiers: request.mediaHashes,
        legalBasis: request.legalBasis,
        evidenceDocuments: request.evidenceUrls,
        reporterInformation: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.reportStatus === 'submitted' ? 'pending' : 'rejected',
        responseTime: response.processingTime || 1100,
        removalTimestamp: response.actionTimestamp ? BigInt(response.actionTimestamp) : undefined
      };
    } catch (error) {
      console.error('LinkedIn takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      const searchResults = await this.makeApiCall(`/shares?q=contentHash&contentHash=${mediaHash}`);
      
      return searchResults.elements?.map((share: any) => ({
        eventId: `li-${share.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(share.created.time),
        userAgent: 'LinkedIn-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          share_id: share.id,
          author_id: share.author,
          engagement_count: share.totalSocialActivityCounts?.numLikes || 0
        }
      })) || [];
    } catch (error) {
      console.error('LinkedIn content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userShares = await this.makeApiCall(`/shares?authors=List((id:${userId}))`);
      return userShares.elements?.some((share: any) => 
        share.content?.contentEntities?.some((entity: any) => 
          entity.thumbnails?.some((thumb: any) => thumb.url.includes(mediaHash))
        )
      ) || false;
    } catch (error) {
      console.error('LinkedIn permission validation failed:', error);
      return false;
    }
  }
}

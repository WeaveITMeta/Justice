import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class FacebookAdapter extends BasePlatformAdapter {
  constructor() {
    super('facebook');
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to Facebook: ${request.requestId}`);
      
      // Facebook's Content Removal API
      const response = await this.makeApiCall('/content_removal_requests', 'POST', {
        media_hashes: request.mediaHashes,
        reason: request.legalBasis,
        evidence_urls: request.evidenceUrls,
        requester_identity: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.status === 'accepted' ? 'pending' : 'rejected',
        responseTime: response.processing_time || 1200,
        removalTimestamp: response.removal_time ? BigInt(response.removal_time) : undefined,
        rejectionReason: response.rejection_reason
      };
    } catch (error) {
      console.error('Facebook takedown request failed:', error);
      return this.generateMockResponse('error');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      // Search for content using Graph API
      const searchResults = await this.makeApiCall(`/search?q=${mediaHash}&type=photo,video`);
      
      return searchResults.data?.map((item: any) => ({
        eventId: `fb-${item.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(new Date(item.created_time).getTime()),
        userAgent: 'Facebook-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          post_id: item.id,
          user_id: item.from?.id,
          engagement: item.likes?.summary?.total_count || 0
        }
      })) || [];
    } catch (error) {
      console.error('Facebook content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userContent = await this.makeApiCall(`/${userId}/photos`);
      return userContent.data?.some((photo: any) => 
        photo.id === mediaHash || photo.source?.includes(mediaHash)
      ) || false;
    } catch (error) {
      console.error('Facebook permission validation failed:', error);
      return false;
    }
  }
}

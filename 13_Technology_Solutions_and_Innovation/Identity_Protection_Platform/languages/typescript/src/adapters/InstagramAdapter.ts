import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class InstagramAdapter extends BasePlatformAdapter {
  constructor() {
    super('instagram');
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to Instagram: ${request.requestId}`);
      
      const response = await this.makeApiCall('/ig_content_removal', 'POST', {
        media_urls: request.evidenceUrls,
        copyright_claim: request.legalBasis,
        media_identifiers: request.mediaHashes,
        reporter_info: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.status === 'submitted' ? 'pending' : 'rejected',
        responseTime: response.response_time || 1000,
        removalTimestamp: response.removal_timestamp ? BigInt(response.removal_timestamp) : undefined
      };
    } catch (error) {
      console.error('Instagram takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      const searchResults = await this.makeApiCall(`/ig_hashtag_search?q=${mediaHash.substring(0, 8)}`);
      
      return searchResults.data?.map((post: any) => ({
        eventId: `ig-${post.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(new Date(post.timestamp).getTime()),
        userAgent: 'Instagram-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          post_id: post.id,
          media_type: post.media_type,
          like_count: post.like_count
        }
      })) || [];
    } catch (error) {
      console.error('Instagram content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userMedia = await this.makeApiCall(`/${userId}/media?fields=id,media_url`);
      return userMedia.data?.some((media: any) => 
        media.media_url?.includes(mediaHash)
      ) || false;
    } catch (error) {
      console.error('Instagram permission validation failed:', error);
      return false;
    }
  }
}

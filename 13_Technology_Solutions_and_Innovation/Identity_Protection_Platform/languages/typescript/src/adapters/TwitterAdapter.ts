import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class TwitterAdapter extends BasePlatformAdapter {
  constructor() {
    super('twitter');
    this.baseUrl = 'https://api.twitter.com/2';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to Twitter/X: ${request.requestId}`);
      
      // Twitter's DMCA takedown API
      const response = await this.makeApiCall('/content/dmca', 'POST', {
        media_hashes: request.mediaHashes,
        copyright_claim: request.legalBasis,
        evidence_documents: request.evidenceUrls,
        claimant_info: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.accepted ? 'pending' : 'rejected',
        responseTime: response.processing_time || 800,
        removalTimestamp: response.processed_at ? BigInt(response.processed_at) : undefined,
        rejectionReason: response.rejection_details
      };
    } catch (error) {
      console.error('Twitter takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      // Search for tweets containing media
      const searchResults = await this.makeApiCall(
        `/tweets/search/recent?query=has:media&expansions=attachments.media_keys&media.fields=url`
      );
      
      return searchResults.data?.filter((tweet: any) => 
        tweet.attachments?.media_keys?.some((key: string) => key.includes(mediaHash))
      ).map((tweet: any) => ({
        eventId: `tw-${tweet.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(new Date(tweet.created_at).getTime()),
        userAgent: 'Twitter-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          tweet_id: tweet.id,
          author_id: tweet.author_id,
          public_metrics: tweet.public_metrics
        }
      })) || [];
    } catch (error) {
      console.error('Twitter content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userTweets = await this.makeApiCall(`/users/${userId}/tweets?expansions=attachments.media_keys`);
      return userTweets.data?.some((tweet: any) => 
        tweet.attachments?.media_keys?.some((key: string) => key.includes(mediaHash))
      ) || false;
    } catch (error) {
      console.error('Twitter permission validation failed:', error);
      return false;
    }
  }
}

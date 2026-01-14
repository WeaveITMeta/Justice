import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class TikTokAdapter extends BasePlatformAdapter {
  constructor() {
    super('tiktok');
    this.baseUrl = 'https://open-api.tiktok.com/v1.3';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to TikTok: ${request.requestId}`);
      
      const response = await this.makeApiCall('/report/submit/', 'POST', {
        report_type: 'copyright',
        content_identifiers: request.mediaHashes,
        legal_basis: request.legalBasis,
        evidence_links: request.evidenceUrls,
        reporter_details: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.report_status === 'received' ? 'pending' : 'rejected',
        responseTime: response.processing_time || 1500,
        removalTimestamp: response.action_timestamp ? BigInt(response.action_timestamp) : undefined
      };
    } catch (error) {
      console.error('TikTok takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      const searchResults = await this.makeApiCall(`/video/search/?keyword=${mediaHash.substring(0, 10)}`);
      
      return searchResults.data?.videos?.map((video: any) => ({
        eventId: `tt-${video.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(video.create_time * 1000),
        userAgent: 'TikTok-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          video_id: video.id,
          author: video.author.unique_id,
          view_count: video.statistics.view_count
        }
      })) || [];
    } catch (error) {
      console.error('TikTok content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userVideos = await this.makeApiCall(`/video/list/?open_id=${userId}`);
      return userVideos.data?.videos?.some((video: any) => 
        video.cover_image_url?.includes(mediaHash) || video.id === mediaHash
      ) || false;
    } catch (error) {
      console.error('TikTok permission validation failed:', error);
      return false;
    }
  }
}

import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class YouTubeAdapter extends BasePlatformAdapter {
  constructor() {
    super('youtube');
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to YouTube: ${request.requestId}`);
      
      const response = await this.makeApiCall('/copyright/claims', 'POST', {
        video_identifiers: request.mediaHashes,
        copyright_basis: request.legalBasis,
        evidence_documentation: request.evidenceUrls,
        claimant_information: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.claim_status === 'filed' ? 'pending' : 'rejected',
        responseTime: response.response_time || 2000,
        removalTimestamp: response.takedown_time ? BigInt(response.takedown_time) : undefined
      };
    } catch (error) {
      console.error('YouTube takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      const searchResults = await this.makeApiCall(`/search?part=snippet&q=${mediaHash.substring(0, 12)}&type=video`);
      
      return searchResults.items?.map((video: any) => ({
        eventId: `yt-${video.id.videoId}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(new Date(video.snippet.publishedAt).getTime()),
        userAgent: 'YouTube-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          video_id: video.id.videoId,
          channel_id: video.snippet.channelId,
          title: video.snippet.title
        }
      })) || [];
    } catch (error) {
      console.error('YouTube content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const channelVideos = await this.makeApiCall(`/channels?part=contentDetails&id=${userId}`);
      return channelVideos.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ? true : false;
    } catch (error) {
      console.error('YouTube permission validation failed:', error);
      return false;
    }
  }
}

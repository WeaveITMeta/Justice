import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class SnapchatAdapter extends BasePlatformAdapter {
  constructor() {
    super('snapchat');
    this.baseUrl = 'https://kit.snapchat.com/v1';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to Snapchat: ${request.requestId}`);
      
      const response = await this.makeApiCall('/content/reports', 'POST', {
        violation_type: 'copyright_infringement',
        media_identifiers: request.mediaHashes,
        legal_documentation: request.legalBasis,
        evidence_urls: request.evidenceUrls,
        reporter_details: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.report_id ? 'pending' : 'rejected',
        responseTime: response.processing_time || 800,
        removalTimestamp: response.removal_timestamp ? BigInt(response.removal_timestamp) : undefined
      };
    } catch (error) {
      console.error('Snapchat takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      // Snapchat content scanning through Snap Kit API
      const searchResults = await this.makeApiCall(`/bitmoji/search?hash=${mediaHash.substring(0, 8)}`);
      
      return searchResults.data?.map((snap: any) => ({
        eventId: `sc-${snap.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(snap.created_at),
        userAgent: 'Snapchat-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          snap_id: snap.id,
          user_id: snap.user_id,
          view_count: snap.view_count
        }
      })) || [];
    } catch (error) {
      console.error('Snapchat content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userSnaps = await this.makeApiCall(`/user/${userId}/snaps`);
      return userSnaps.data?.some((snap: any) => 
        snap.media_url?.includes(mediaHash) || snap.thumbnail_url?.includes(mediaHash)
      ) || false;
    } catch (error) {
      console.error('Snapchat permission validation failed:', error);
      return false;
    }
  }
}

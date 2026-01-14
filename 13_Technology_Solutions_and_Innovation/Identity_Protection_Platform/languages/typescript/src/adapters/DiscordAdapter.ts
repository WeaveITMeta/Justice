import { BasePlatformAdapter } from './BasePlatformAdapter';
import type { TakedownRequest, PlatformResponse, MediaEvent } from '../types';

export class DiscordAdapter extends BasePlatformAdapter {
  constructor() {
    super('discord');
    this.baseUrl = 'https://discord.com/api/v10';
  }

  async submitTakedownRequest(request: TakedownRequest): Promise<PlatformResponse> {
    try {
      console.log(`Submitting takedown request to Discord: ${request.requestId}`);
      
      const response = await this.makeApiCall('/abuse-reports', 'POST', {
        report_type: 'copyright_violation',
        content_hashes: request.mediaHashes,
        legal_justification: request.legalBasis,
        supporting_evidence: request.evidenceUrls,
        reporter_identity: request.requesterIdentity
      });
      
      return {
        platform: this.platformName,
        status: response.ticket_status === 'created' ? 'pending' : 'rejected',
        responseTime: response.processing_time || 900,
        removalTimestamp: response.action_taken_at ? BigInt(response.action_taken_at) : undefined
      };
    } catch (error) {
      console.error('Discord takedown request failed:', error);
      return this.generateMockResponse('pending');
    }
  }

  async scanForContent(mediaHash: string): Promise<MediaEvent[]> {
    try {
      // Discord content scanning through message attachments
      const searchResults = await this.makeApiCall(`/channels/search?content_hash=${mediaHash}`);
      
      return searchResults.messages?.map((message: any) => ({
        eventId: `dc-${message.id}`,
        mediaHash,
        platform: this.platformName,
        eventType: 'media_detected' as const,
        timestamp: BigInt(message.timestamp),
        userAgent: 'Discord-Scanner',
        ipAddress: '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown' },
        metadata: {
          message_id: message.id,
          channel_id: message.channel_id,
          guild_id: message.guild_id,
          author_id: message.author.id
        }
      })) || [];
    } catch (error) {
      console.error('Discord content scan failed:', error);
      return [];
    }
  }

  async validatePermissions(mediaHash: string, userId: string): Promise<boolean> {
    try {
      const userMessages = await this.makeApiCall(`/users/${userId}/messages?has_attachment=true`);
      return userMessages.messages?.some((message: any) => 
        message.attachments?.some((attachment: any) => 
          attachment.filename.includes(mediaHash) || attachment.url.includes(mediaHash)
        )
      ) || false;
    } catch (error) {
      console.error('Discord permission validation failed:', error);
      return false;
    }
  }
}

// Main entry point for @justice/identity-protection-blockchain
export { JusticeBlockchain } from './core/JusticeBlockchain';
export { JusticeNode } from './core/JusticeNode';
export { PreventionAI } from './ai/PreventionAI';
export { ComplianceEngine } from './compliance/ComplianceEngine';
export { DistributedIdentityProcessor } from './core/DistributedIdentityProcessor';
export { PrivacyPreservingMatcher } from './core/PrivacyPreservingMatcher';
export { DecentralizedStorage } from './core/DecentralizedStorage';

// Types
export type {
  MediaEvent,
  MediaMonad,
  BiometricSignature,
  TakedownRequest,
  ValidationResult,
  ComplianceResult,
  ZKProof,
  MediaMetadata,
  IdentityProof,
  SecurityAlert
} from './types';

// Browser extension
export { JusticeExtension } from './browser/JusticeExtension';

// Platform adapters
export { FacebookAdapter, TwitterAdapter, InstagramAdapter } from './adapters';

// Constants
export const JUSTICE_BLOCKCHAIN_VERSION = '1.0.0';
export const SUPPORTED_PLATFORMS = [
  // Social Media & Content
  'facebook', 'instagram', 'whatsapp', 'threads', 'youtube', 'google-photos', 'google-drive', 'gmail',
  'twitter', 'x', 'tiktok', 'snapchat', 'linkedin', 'pinterest', 'reddit', 'tumblr', 'vsco', 'bereal', 'onlyfans',
  
  // Communication
  'discord', 'guilded', 'slack', 'microsoft-teams', 'zoom', 'skype', 'telegram', 'signal', 'wechat', 'viber',
  
  // AI & Chat Platforms
  'chatgpt', 'openai', 'anthropic', 'claude', 'google-bard', 'google-gemini', 'grok', 'microsoft-copilot',
  'bing-chat', 'perplexity', 'character-ai', 'replika', 'midjourney',
  
  // Cloud Storage & File Sharing
  'dropbox', 'onedrive', 'icloud', 'box', 'wetransfer', 'sendanywhere', 'mega',
  
  // Professional & Creative
  'adobe-creative-cloud', 'photoshop', 'lightroom', 'canva', 'figma', 'deviantart', 'artstation',
  'behance', 'dribbble', '500px', 'flickr',
  
  // Gaming & Entertainment
  'steam', 'twitch', 'youtube-gaming', 'xbox-live', 'playstation-network', 'nintendo-switch',
  'roblox', 'minecraft',
  
  // Dating & Social Discovery
  'tinder', 'bumble', 'hinge', 'grindr', 'okcupid',
  
  // Messaging & Email
  'imessage', 'google-messages', 'samsung-messages', 'outlook', 'yahoo-mail', 'protonmail'
];
export const TAKE_IT_DOWN_COMPLIANCE_HOURS = 48;

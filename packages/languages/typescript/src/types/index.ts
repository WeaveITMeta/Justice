// Core types for Justice Identity Protection Blockchain

export interface MediaEvent {
  eventId: string;
  timestamp: bigint;
  mediaHash: string;
  identityHash: string;
  eventType: 'upload' | 'view' | 'share' | 'modify' | 'delete' | 'takedown_request';
  platformId: string;
  deviceFingerprint: string;
  consensusProof: ConsensusProof;
  location?: GeolocationData;
  userAgent?: string;
}

export interface ConsensusProof {
  validatorNodes: string[];
  signatures: string[];
  merkleRoot: string;
  blockHeight: number;
  consensusTimestamp: bigint;
  validationScore: number;
}

export interface MediaMonad {
  id: string;
  mediaHash: string;
  features: Float32Array; // Neural network extracted features
  biometricSignatures: BiometricSignature[];
  temporalIndependence: boolean;
  validationState: 'pending' | 'validated' | 'disputed' | 'takedown_approved';
  privacyLevel: 'public' | 'private' | 'restricted';
  encryptedMetadata?: string;
}

export interface BiometricSignature {
  type: 'facial' | 'voice' | 'body' | 'behavioral' | 'gait' | 'typing_pattern';
  confidence: number;
  identityMatch: string;
  deepfakeScore: number;
  extractedFeatures: number[];
  validationTimestamp: bigint;
}

export interface TakedownRequest {
  requestId: string;
  mediaHash: string;
  platforms: string[];
  identityProof: IdentityProof;
  legalBasis: 'ncii' | 'deepfake' | 'identity_theft' | 'extortion' | 'harassment' | 'impersonation';
  urgencyLevel: 'standard' | 'expedited' | 'emergency';
  evidencePackage: LegalEvidence;
  submissionTimestamp: bigint;
  complianceDeadline: bigint;
  status: 'submitted' | 'processing' | 'approved' | 'rejected' | 'completed';
}

export interface IdentityProof {
  publicKey: string;
  signature: string;
  biometricHash: string;
  governmentIdHash?: string;
  zkProof: ZKProof;
  trustScore: number;
}

export interface ZKProof {
  proof: string;
  publicSignals: string[];
  verificationKey: string;
  circuit: string;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  validatorCount: number;
  consensusAchieved: boolean;
  disputes: Dispute[];
  validationTimestamp: bigint;
}

export interface Dispute {
  disputeId: string;
  disputingValidator: string;
  reason: string;
  evidence: string;
  resolution?: 'upheld' | 'dismissed';
}

export interface ComplianceResult {
  requestId: string;
  platformResponses: PlatformResponse[];
  overallStatus: 'compliant' | 'partial' | 'non_compliant' | 'pending';
  compliancePercentage: number;
  actionsTaken: ComplianceAction[];
  legalEscalation?: boolean;
}

export interface PlatformResponse {
  platform: string;
  status: 'removed' | 'not_found' | 'rejected' | 'pending' | 'error';
  responseTime: number;
  removalTimestamp?: bigint;
  rejectionReason?: string;
  contactInfo?: string;
}

export interface ComplianceAction {
  action: 'content_removed' | 'account_suspended' | 'legal_notice_sent' | 'evidence_preserved';
  platform: string;
  timestamp: bigint;
  details: string;
}

export interface LegalEvidence {
  evidenceId: string;
  mediaHashes: string[];
  blockchainProofs: ConsensusProof[];
  timestampChain: bigint[];
  platformEvidence: PlatformEvidence[];
  biometricEvidence: BiometricSignature[];
  encryptedBackup: string;
  hashChain: string;
}

export interface PlatformEvidence {
  platform: string;
  urls: string[];
  screenshots: string[];
  networkLogs: string[];
  userInteractions: string[];
  extractionTimestamp: bigint;
}

export interface SecurityAlert {
  alertId: string;
  type: 'unauthorized_upload' | 'deepfake_detected' | 'identity_theft' | 'extortion_attempt' | 'social_engineering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  mediaHash?: string;
  suspiciousActivity: string;
  recommendedActions: string[];
  autoActionTaken: boolean;
  timestamp: bigint;
}

export interface MediaMetadata {
  originalFilename?: string;
  mimeType: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  creationDate?: bigint;
  deviceInfo?: DeviceInfo;
  locationData?: GeolocationData;
  cameraSettings?: CameraSettings;
  editHistory?: EditEvent[];
}

export interface DeviceInfo {
  deviceId: string;
  model: string;
  os: string;
  appVersion: string;
  fingerprint: string;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: bigint;
}

export interface CameraSettings {
  iso: number;
  aperture: number;
  shutterSpeed: number;
  focal: number;
  flash: boolean;
}

export interface EditEvent {
  type: 'crop' | 'filter' | 'text_overlay' | 'blur' | 'deepfake_edit';
  timestamp: bigint;
  tool: string;
  parameters: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  processedBy: string[];
  results: Record<string, any>;
  processingTime: number;
  resourcesUsed: ResourceUsage;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryUsed: number;
  networkBandwidth: number;
  storageUsed: number;
}

export interface MediaUsageReport {
  identityHash: string;
  usageEvents: MediaEvent[];
  platforms: string[];
  suspiciousActivity: SecurityAlert[];
  takedownRequests: TakedownRequest[];
  overallRiskScore: number;
  lastUpdated: bigint;
}

export interface PreventionResult {
  shouldBlock: boolean;
  confidence: number;
  reasons: string[];
  alternativeActions: string[];
  riskScore: number;
  biometricMatch?: BiometricSignature;
}

export interface UserFeedback {
  feedbackId: string;
  userId: string;
  actionTaken: string;
  wasCorrect: boolean;
  improvements: string[];
  severity: number;
  timestamp: bigint;
}

export interface ActivityPattern {
  features: number[];
  userId: string;
  timeWindow: number;
  platforms: string[];
}

export interface ThreatLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  indicators: string[];
}

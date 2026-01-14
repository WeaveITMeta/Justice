# Transcription & Email Automation Workflow

## Overview

The Transcription & Email Automation system provides Otter.ai-style transcription services for legal calls, automatically generating tickets, drafting emails for support agents, and ensuring comprehensive documentation of all legal interactions while maintaining confidentiality and legal privilege standards.

## Transcription Engine Architecture

### Real-Time Transcription Pipeline
```typescript
interface TranscriptionPipeline {
  audio_processing: {
    input_formats: ["wav", "mp3", "opus", "webm"],
    sample_rate: "16kHz_minimum_44kHz_preferred",
    channel_support: "mono_and_stereo",
    noise_reduction: "ai_powered_background_filtering",
    speaker_diarization: "multi_speaker_identification"
  };
  
  transcription_engines: {
    primary: {
      service: "OpenAI_Whisper_v3_large",
      accuracy: "99.2%_in_legal_context",
      latency: "real_time_streaming_150ms",
      language_support: ["en", "es", "fr", "zh", "ar"]
    },
    
    fallback: {
      service: "Google_Speech_to_Text_Enhanced",
      accuracy: "98.5%_in_legal_context", 
      latency: "real_time_streaming_200ms",
      specialization: "legal_terminology_model"
    },
    
    offline_backup: {
      service: "Mozilla_DeepSpeech_Legal",
      accuracy: "96%_offline_processing",
      use_case: "network_connectivity_issues",
      privacy: "on_premise_processing"
    }
  };
  
  post_processing: {
    legal_terminology: "context_aware_correction",
    punctuation: "grammar_and_legal_formatting",
    redaction: "automatic_pii_detection_removal",
    confidence_scoring: "word_level_accuracy_metrics"
  };
}
```

### Rust Implementation for High-Performance Processing
```rust
use tokio::sync::mpsc;
use whisper_rs::{WhisperContext, FullParams, SamplingStrategy};
use serde::{Serialize, Deserialize};

pub struct LegalTranscriptionEngine {
    whisper_context: WhisperContext,
    audio_receiver: mpsc::Receiver<AudioChunk>,
    transcript_sender: mpsc::Sender<TranscriptSegment>,
    legal_processor: LegalTerminologyProcessor,
    pii_redactor: PIIRedactionEngine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioChunk {
    pub call_id: String,
    pub chunk_id: u64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub audio_data: Vec<f32>,
    pub speaker_id: Option<String>,
    pub sample_rate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptSegment {
    pub call_id: String,
    pub segment_id: u64,
    pub start_time: f64,
    pub end_time: f64,
    pub speaker_id: Option<String>,
    pub text: String,
    pub confidence_score: f32,
    pub legal_entities: Vec<LegalEntity>,
    pub redacted_content: bool,
}

impl LegalTranscriptionEngine {
    pub fn new() -> Result<Self, TranscriptionError> {
        let whisper_context = WhisperContext::new("models/whisper-large-v3-legal.bin")?;
        let (audio_tx, audio_rx) = mpsc::channel(1000);
        let (transcript_tx, transcript_rx) = mpsc::channel(1000);
        
        Ok(Self {
            whisper_context,
            audio_receiver: audio_rx,
            transcript_sender: transcript_tx,
            legal_processor: LegalTerminologyProcessor::new()?,
            pii_redactor: PIIRedactionEngine::new()?,
        })
    }
    
    pub async fn process_real_time_audio(&mut self) -> Result<(), TranscriptionError> {
        let mut audio_buffer = Vec::new();
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        
        // Configure for legal transcription
        params.set_language(Some("en"));
        params.set_translate(false);
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        
        while let Some(audio_chunk) = self.audio_receiver.recv().await {
            // Accumulate audio for processing windows
            audio_buffer.extend_from_slice(&audio_chunk.audio_data);
            
            // Process in 10-second windows for real-time transcription
            if audio_buffer.len() >= audio_chunk.sample_rate as usize * 10 {
                let transcript_result = self.transcribe_audio_segment(
                    &audio_buffer,
                    &audio_chunk,
                    &mut params
                ).await?;
                
                // Process legal terminology and entities
                let processed_transcript = self.legal_processor
                    .enhance_legal_accuracy(&transcript_result).await?;
                
                // Apply PII redaction
                let redacted_transcript = self.pii_redactor
                    .redact_sensitive_information(&processed_transcript).await?;
                
                // Send processed segment
                self.transcript_sender.send(redacted_transcript).await?;
                
                // Clear processed audio (keep 2-second overlap)
                let overlap_samples = audio_chunk.sample_rate as usize * 2;
                audio_buffer = audio_buffer.split_off(
                    audio_buffer.len().saturating_sub(overlap_samples)
                );
            }
        }
        
        Ok(())
    }
    
    async fn transcribe_audio_segment(
        &self,
        audio_data: &[f32],
        chunk_info: &AudioChunk,
        params: &mut FullParams
    ) -> Result<TranscriptSegment, TranscriptionError> {
        
        // Run Whisper transcription
        let mut state = self.whisper_context.create_state()?;
        state.full(params, audio_data)?;
        
        let num_segments = state.full_n_segments()?;
        let mut combined_text = String::new();
        let mut total_confidence = 0.0;
        
        for i in 0..num_segments {
            let segment_text = state.full_get_segment_text(i)?;
            let segment_start = state.full_get_segment_t0(i)?;
            let segment_end = state.full_get_segment_t1(i)?;
            
            combined_text.push_str(&segment_text);
            
            // Calculate confidence score (Whisper doesn't provide native confidence)
            total_confidence += self.estimate_confidence(&segment_text);
        }
        
        let average_confidence = total_confidence / num_segments as f32;
        
        Ok(TranscriptSegment {
            call_id: chunk_info.call_id.clone(),
            segment_id: chunk_info.chunk_id,
            start_time: 0.0, // Will be calculated based on chunk position
            end_time: audio_data.len() as f64 / chunk_info.sample_rate as f64,
            speaker_id: chunk_info.speaker_id.clone(),
            text: combined_text,
            confidence_score: average_confidence,
            legal_entities: Vec::new(), // Will be populated by legal processor
            redacted_content: false, // Will be set by redaction engine
        })
    }
    
    fn estimate_confidence(&self, text: &str) -> f32 {
        // Heuristic confidence estimation based on:
        // - Text coherence
        // - Legal terminology presence
        // - Grammar correctness
        let coherence_score = self.calculate_text_coherence(text);
        let legal_term_score = self.calculate_legal_terminology_score(text);
        let grammar_score = self.calculate_grammar_score(text);
        
        (coherence_score + legal_term_score + grammar_score) / 3.0
    }
}

pub struct LegalTerminologyProcessor {
    legal_dictionary: std::collections::HashSet<String>,
    entity_recognizer: LegalEntityRecognizer,
}

impl LegalTerminologyProcessor {
    pub async fn enhance_legal_accuracy(
        &self,
        transcript: &TranscriptSegment
    ) -> Result<TranscriptSegment, ProcessingError> {
        let mut enhanced_transcript = transcript.clone();
        
        // Correct legal terminology using context
        enhanced_transcript.text = self.correct_legal_terms(&transcript.text)?;
        
        // Extract legal entities
        enhanced_transcript.legal_entities = self.entity_recognizer
            .extract_entities(&enhanced_transcript.text).await?;
        
        // Adjust confidence based on legal accuracy
        enhanced_transcript.confidence_score = self.adjust_confidence_for_legal_context(
            transcript.confidence_score,
            &enhanced_transcript.legal_entities
        )?;
        
        Ok(enhanced_transcript)
    }
    
    fn correct_legal_terms(&self, text: &str) -> Result<String, ProcessingError> {
        let mut corrected_text = text.to_string();
        
        // Common legal term corrections
        let corrections = [
            ("plead", "plea"),
            ("defendant", "defendant"), // Ensure correct spelling
            ("plaintiff", "plaintiff"),
            ("subpoena", "subpoena"),
            ("voir dire", "voir dire"),
            ("amicus curiae", "amicus curiae"),
        ];
        
        for (incorrect, correct) in &corrections {
            corrected_text = corrected_text.replace(incorrect, correct);
        }
        
        Ok(corrected_text)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegalEntity {
    pub entity_type: LegalEntityType,
    pub text: String,
    pub start_offset: usize,
    pub end_offset: usize,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LegalEntityType {
    CaseNumber,
    StatuteCitation,
    CourtName,
    JudgeName,
    AttorneyName,
    LegalProcedure,
    EvidenceReference,
    Date,
    MonetaryAmount,
}
```

## Email Automation System

### Intelligent Email Generation
```typescript
interface EmailAutomationSystem {
  email_generation: {
    ai_drafting: {
      model: "GPT-4_legal_specialist",
      templates: "context_aware_legal_templates",
      tone_adaptation: "professional_empathetic_urgent",
      personalization: "case_specific_customization"
    },
    
    content_structure: {
      header_generation: "case_summary_and_urgency",
      body_composition: "key_facts_and_recommendations", 
      action_items: "clear_next_steps_with_deadlines",
      footer_information: "contact_details_and_disclaimers"
    },
    
    quality_assurance: {
      legal_accuracy_check: "ai_powered_content_validation",
      tone_appropriateness: "sensitivity_analysis",
      completeness_verification: "required_information_checklist",
      compliance_review: "regulatory_requirement_validation"
    }
  };
  
  routing_intelligence: {
    recipient_determination: {
      urgency_based_routing: "crisis_vs_standard_vs_informational",
      specialization_matching: "expertise_area_alignment",
      workload_balancing: "agent_availability_optimization",
      escalation_triggers: "supervisor_involvement_criteria"
    },
    
    multi_agency_coordination: {
      law_enforcement: "police_report_integration",
      social_services: "victim_support_referrals",
      legal_aid: "pro_bono_attorney_matching",
      medical_services: "trauma_counselor_coordination"
    }
  };
}
```

### TypeScript Email Generation Service
```typescript
import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';
import { z } from 'zod';

interface EmailGenerationService {
  generateSupportEmail(
    callTranscript: CallTranscript,
    caseData: CaseData,
    urgencyLevel: UrgencyLevel
  ): Promise<GeneratedEmail>;
}

class LegalEmailAutomation implements EmailGenerationService {
  private openai: OpenAI;
  private emailTransporter: nodemailer.Transporter;
  private templateEngine: EmailTemplateEngine;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_EMAIL_PASSWORD,
      },
    });
    
    this.templateEngine = new EmailTemplateEngine();
  }
  
  async generateSupportEmail(
    callTranscript: CallTranscript,
    caseData: CaseData,
    urgencyLevel: UrgencyLevel
  ): Promise<GeneratedEmail> {
    
    // Generate ticket number
    const ticketNumber = this.generateTicketNumber(caseData);
    
    // Create AI prompt for email generation
    const emailPrompt = this.buildEmailPrompt(
      callTranscript,
      caseData,
      urgencyLevel,
      ticketNumber
    );
    
    // Generate email content using AI
    const aiResponse = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping to draft professional emails for legal support agents. Generate clear, empathetic, and actionable emails based on hotline call transcripts. Always maintain professional tone while showing appropriate sensitivity to the caller's situation.`
        },
        {
          role: "user",
          content: emailPrompt
        }
      ],
      temperature: 0.3, // Low temperature for consistent, professional output
      max_tokens: 1500
    });
    
    const generatedContent = aiResponse.choices[0].message.content;
    
    // Parse and structure the generated content
    const structuredEmail = await this.structureEmailContent(
      generatedContent,
      ticketNumber,
      urgencyLevel
    );
    
    // Apply template and formatting
    const formattedEmail = await this.templateEngine.applyTemplate(
      structuredEmail,
      caseData.caseType
    );
    
    // Determine recipients based on case type and urgency
    const recipients = await this.determineRecipients(caseData, urgencyLevel);
    
    return {
      ticketNumber,
      subject: formattedEmail.subject,
      htmlContent: formattedEmail.htmlBody,
      textContent: formattedEmail.textBody,
      recipients,
      urgencyLevel,
      attachments: await this.generateAttachments(callTranscript, caseData),
      metadata: {
        caseId: caseData.id,
        callId: callTranscript.id,
        generatedAt: new Date(),
        aiModel: "gpt-4",
        urgencyScore: this.calculateUrgencyScore(callTranscript, urgencyLevel)
      }
    };
  }
  
  private buildEmailPrompt(
    transcript: CallTranscript,
    caseData: CaseData,
    urgency: UrgencyLevel,
    ticketNumber: string
  ): string {
    return `
Generate a professional support email based on this legal hotline call:

TICKET NUMBER: ${ticketNumber}
URGENCY LEVEL: ${urgency}
CASE TYPE: ${caseData.caseType}

CALL TRANSCRIPT SUMMARY:
${transcript.summary}

KEY CONCERNS RAISED:
${transcript.keyIssues.join('\n- ')}

CALLER INFORMATION:
- Location: ${transcript.callerLocation || 'Not disclosed'}
- Preferred Contact: ${transcript.preferredContact || 'Phone'}
- Language: ${transcript.language || 'English'}

EVIDENCE MENTIONED:
${transcript.evidenceReferences.join('\n- ')}

Please generate an email with:
1. Professional subject line indicating urgency and case type
2. Empathetic opening acknowledging the caller's situation
3. Clear summary of the call and next steps
4. Specific action items for the support agent
5. Timeline expectations for follow-up
6. Relevant resources and referrals
7. Contact information for immediate assistance if needed

The email should be professional but compassionate, showing we take their concerns seriously while providing clear guidance on next steps.
    `;
  }
  
  private async structureEmailContent(
    content: string,
    ticketNumber: string,
    urgency: UrgencyLevel
  ): Promise<StructuredEmail> {
    // Parse AI-generated content into structured format
    const subjectMatch = content.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 
      `${urgency.toUpperCase()} - Legal Support Required - Ticket #${ticketNumber}`;
    
    // Extract sections using regex or AI parsing
    const bodyContent = content.replace(/Subject:\s*.+/i, '').trim();
    
    return {
      subject,
      body: bodyContent,
      ticketNumber,
      urgencyIndicator: this.getUrgencyIndicator(urgency)
    };
  }
  
  private async determineRecipients(
    caseData: CaseData,
    urgency: UrgencyLevel
  ): Promise<EmailRecipient[]> {
    const recipients: EmailRecipient[] = [];
    
    // Base assignment logic
    switch (caseData.caseType) {
      case 'sexual_assault':
        recipients.push({
          email: 'trauma-specialists@justice-legal.com',
          role: 'trauma_specialist',
          priority: 'primary'
        });
        break;
        
      case 'workplace_harassment':
        recipients.push({
          email: 'employment-law@justice-legal.com',
          role: 'employment_attorney',
          priority: 'primary'
        });
        break;
        
      case 'domestic_violence':
        recipients.push({
          email: 'crisis-intervention@justice-legal.com',
          role: 'crisis_counselor',
          priority: 'primary'
        });
        break;
        
      default:
        recipients.push({
          email: 'general-legal@justice-legal.com',
          role: 'general_counsel',
          priority: 'primary'
        });
    }
    
    // Add supervisors for high urgency cases
    if (urgency === UrgencyLevel.Emergency || urgency === UrgencyLevel.Crisis) {
      recipients.push({
        email: 'supervisor-on-call@justice-legal.com',
        role: 'supervisor',
        priority: 'cc'
      });
    }
    
    return recipients;
  }
  
  private generateTicketNumber(caseData: CaseData): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const typeCode = this.getCaseTypeCode(caseData.caseType);
    
    return `JUS-${typeCode}-${dateStr}-${randomId}`;
  }
  
  private getCaseTypeCode(caseType: string): string {
    const codes = {
      'sexual_assault': 'SA',
      'workplace_harassment': 'WH', 
      'domestic_violence': 'DV',
      'defamation': 'DEF',
      'employment_discrimination': 'ED',
      'civil_rights_violation': 'CR'
    };
    
    return codes[caseType] || 'GEN';
  }
}

interface GeneratedEmail {
  ticketNumber: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  recipients: EmailRecipient[];
  urgencyLevel: UrgencyLevel;
  attachments: EmailAttachment[];
  metadata: EmailMetadata;
}

interface EmailRecipient {
  email: string;
  role: string;
  priority: 'primary' | 'cc' | 'bcc';
}

interface CallTranscript {
  id: string;
  summary: string;
  keyIssues: string[];
  evidenceReferences: string[];
  callerLocation?: string;
  preferredContact?: string;
  language?: string;
}

enum UrgencyLevel {
  Emergency = 'emergency',
  Crisis = 'crisis', 
  Urgent = 'urgent',
  Standard = 'standard',
  Informational = 'informational'
}
```

## Workflow Orchestration

### n8n Workflow Configuration
```json
{
  "name": "Legal Hotline Transcription & Email Automation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "call-completed",
        "responseMode": "responseNode",
        "responseData": "allEntries"
      },
      "name": "Call Completion Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "functionCode": "// Extract call metadata\nconst callData = items[0].json;\n\nreturn [{\n  json: {\n    callId: callData.callId,\n    duration: callData.duration,\n    audioUrl: callData.recordingUrl,\n    callerInfo: callData.caller,\n    urgencyLevel: callData.urgencyDetected || 'standard'\n  }\n}];"
      },
      "name": "Process Call Data",
      "type": "n8n-nodes-base.function",
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "https://api.justice-legal.com/transcribe",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.TRANSCRIPTION_API_KEY}}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "audioUrl", 
              "value": "{{$json['audioUrl']}}"
            },
            {
              "name": "callId",
              "value": "{{$json['callId']}}"
            },
            {
              "name": "priority",
              "value": "{{$json['urgencyLevel']}}"
            }
          ]
        }
      },
      "name": "Generate Transcription",
      "type": "n8n-nodes-base.httpRequest",
      "position": [680, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "{{$json['urgencyLevel']}}",
              "operation": "equal",
              "value2": "emergency"
            }
          ]
        }
      },
      "name": "Check Urgency Level",
      "type": "n8n-nodes-base.if",
      "position": [900, 300]
    },
    {
      "parameters": {
        "url": "https://api.justice-legal.com/generate-email",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.EMAIL_API_KEY}}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "transcript",
              "value": "{{$json['transcriptionResult']}}"
            },
            {
              "name": "urgency",
              "value": "{{$json['urgencyLevel']}}"
            },
            {
              "name": "caseType",
              "value": "{{$json['detectedCaseType']}}"
            }
          ]
        }
      },
      "name": "Generate Support Email",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1120, 200]
    },
    {
      "parameters": {
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "gmailApi",
        "subject": "{{$json['emailSubject']}}",
        "message": "{{$json['emailBody']}}",
        "toList": "{{$json['recipients']}}",
        "attachments": "{{$json['attachments']}}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.gmail",
      "position": [1340, 200]
    },
    {
      "parameters": {
        "url": "https://api.justice-legal.com/emergency-dispatch",
        "sendHeaders": true,
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "callId",
              "value": "{{$json['callId']}}"
            },
            {
              "name": "transcript",
              "value": "{{$json['transcriptionResult']}}"
            },
            {
              "name": "immediateAction",
              "value": "true"
            }
          ]
        }
      },
      "name": "Emergency Dispatch",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1120, 400]
    }
  ],
  "connections": {
    "Call Completion Webhook": {
      "main": [[{"node": "Process Call Data", "type": "main", "index": 0}]]
    },
    "Process Call Data": {
      "main": [[{"node": "Generate Transcription", "type": "main", "index": 0}]]
    },
    "Generate Transcription": {
      "main": [[{"node": "Check Urgency Level", "type": "main", "index": 0}]]
    },
    "Check Urgency Level": {
      "main": [
        [{"node": "Generate Support Email", "type": "main", "index": 0}],
        [{"node": "Emergency Dispatch", "type": "main", "index": 0}]
      ]
    },
    "Generate Support Email": {
      "main": [[{"node": "Send Email", "type": "main", "index": 0}]]
    }
  }
}
```

## Security & Compliance

### Transcript Security Measures
```typescript
interface TranscriptSecurity {
  encryption: {
    at_rest: "AES_256_GCM_with_HSM_keys",
    in_transit: "TLS_1_3_with_perfect_forward_secrecy",
    key_rotation: "automatic_quarterly_rotation"
  };
  
  access_control: {
    role_based_permissions: "attorney_client_privilege_aware",
    audit_logging: "comprehensive_access_tracking",
    time_based_access: "session_timeout_controls",
    geographic_restrictions: "jurisdiction_based_access"
  };
  
  retention_policy: {
    transcript_retention: "7_years_encrypted_storage",
    automatic_deletion: "gdpr_right_to_be_forgotten",
    legal_hold: "litigation_preservation_override",
    backup_encryption: "separate_key_management"
  };
  
  compliance_monitoring: {
    hipaa_compliance: "healthcare_information_protection",
    attorney_client_privilege: "privileged_communication_protection",
    court_reporting_standards: "certified_transcript_formatting",
    evidence_chain_custody: "immutable_audit_trail"
  };
}
```

This transcription and email automation system ensures accurate, secure, and legally compliant documentation of all hotline interactions while providing immediate, intelligent support to both callers and legal professionals.

# RAG Database Architecture with Redis Caching

## Overview

The Retrieval-Augmented Generation (RAG) database system provides intelligent legal information retrieval with Redis caching for high-performance access to standardized hotlines, legal procedures, case law, and crisis intervention protocols.

## Architecture Components

### Primary Database Layer (PostgreSQL)

#### Core Schema Design
```sql
-- Legal Knowledge Base Tables
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL, -- 'statute', 'case_law', 'regulation', 'procedure'
    jurisdiction VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    content_vector VECTOR(1536), -- OpenAI embedding dimensions
    full_text TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE standardized_hotlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotline_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- 'crisis', 'legal_aid', 'emergency', 'support'
    coverage_area VARCHAR(100) NOT NULL,
    languages TEXT[], -- Array of supported language codes
    availability_schedule JSONB,
    specialties TEXT[],
    embedding_vector VECTOR(1536),
    sla_seconds INTEGER,
    escalation_protocol JSONB,
    compliance_requirements JSONB
);

CREATE TABLE emergency_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_name VARCHAR(200) NOT NULL,
    trigger_conditions TEXT[],
    step_by_step_actions JSONB,
    required_authorities TEXT[],
    documentation_requirements JSONB,
    legal_implications TEXT,
    embedding_vector VECTOR(1536),
    urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5)
);

CREATE TABLE case_law_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_citation VARCHAR(500) NOT NULL,
    court_name VARCHAR(200) NOT NULL,
    decision_date DATE NOT NULL,
    case_summary TEXT NOT NULL,
    legal_precedent TEXT NOT NULL,
    relevant_statutes TEXT[],
    case_outcome VARCHAR(100),
    embedding_vector VECTOR(1536),
    jurisdiction VARCHAR(100) NOT NULL,
    case_type VARCHAR(100) NOT NULL
);
```

#### Vector Search Indexing
```sql
-- Create vector similarity search indexes
CREATE INDEX idx_legal_docs_vector ON legal_documents 
USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_hotlines_vector ON standardized_hotlines 
USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_procedures_vector ON emergency_procedures 
USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_case_law_vector ON case_law_database 
USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
```

### Redis Caching Layer

#### Cache Strategy Architecture
```typescript
interface RedisCacheStrategy {
  // Hot data - frequently accessed within minutes
  hot_cache: {
    ttl_seconds: 300, // 5 minutes
    data_types: [
      "active_call_contexts",
      "emergency_procedures",
      "crisis_hotline_availability",
      "real_time_agent_status"
    ]
  };
  
  // Warm data - accessed within hours
  warm_cache: {
    ttl_seconds: 3600, // 1 hour
    data_types: [
      "legal_document_embeddings",
      "case_law_precedents",
      "jurisdiction_specific_laws",
      "hotline_routing_rules"
    ]
  };
  
  // Cold data - accessed daily/weekly
  cold_cache: {
    ttl_seconds: 86400, // 24 hours
    data_types: [
      "historical_case_analytics",
      "compliance_audit_logs",
      "training_data_vectors",
      "system_configuration"
    ]
  };
}
```

#### Redis Cluster Configuration
```yaml
# Redis Cluster Setup for High Availability
redis_cluster:
  nodes:
    - host: "redis-legal-01.justice.internal"
      port: 6379
      role: "master"
      slots: "0-5460"
    - host: "redis-legal-02.justice.internal" 
      port: 6379
      role: "master"
      slots: "5461-10922"
    - host: "redis-legal-03.justice.internal"
      port: 6379
      role: "master" 
      slots: "10923-16383"
  
  replica_configuration:
    replicas_per_master: 2
    failover_timeout: 5000
    cluster_node_timeout: 15000
    
  memory_policy:
    maxmemory: "8GB"
    maxmemory_policy: "allkeys-lru"
    save_policy: "900 1 300 10 60 10000" # RDB snapshots
```

## RAG Query Processing Pipeline

### 1. Query Preprocessing
```typescript
interface QueryPreprocessor {
  text_normalization: {
    lowercase: true,
    remove_stopwords: false, // Keep legal stopwords
    lemmatization: true,
    legal_term_expansion: true // "assault" -> ["assault", "battery", "violence"]
  };
  
  entity_extraction: {
    legal_entities: ["PERSON", "ORG", "STATUTE", "CASE_CITATION"],
    jurisdiction_detection: "regex_plus_nlp",
    urgency_indicators: ["emergency", "urgent", "immediate", "crisis"],
    case_type_classification: "ml_model_inference"
  };
  
  context_enhancement: {
    caller_history: "redis_lookup",
    session_context: "conversation_memory",
    geographic_context: "jurisdiction_mapping",
    temporal_context: "business_hours_awareness"
  };
}
```

### 2. Vector Similarity Search
```typescript
interface VectorSearch {
  embedding_generation: {
    model: "text-embedding-3-large", // OpenAI's latest
    dimensions: 1536,
    batch_processing: true,
    cache_embeddings: "redis_vector_cache"
  };
  
  similarity_algorithms: {
    primary: "cosine_similarity",
    fallback: "euclidean_distance", 
    threshold: 0.75, // Minimum similarity score
    max_results: 20
  };
  
  search_optimization: {
    pre_filtering: "jurisdiction_and_type",
    post_ranking: "relevance_plus_recency",
    result_diversification: "max_marginal_relevance"
  };
}
```

### 3. Context-Aware Retrieval
```rust
// Rust implementation for high-performance retrieval
use redis::Commands;
use postgres::{Client, NoTls};
use serde_json::Value;

pub struct RAGRetriever {
    redis_client: redis::Client,
    pg_client: Client,
}

impl RAGRetriever {
    pub async fn retrieve_legal_context(
        &mut self,
        query_embedding: Vec<f32>,
        caller_context: CallerContext,
        urgency_level: UrgencyLevel
    ) -> Result<LegalContextResponse, RAGError> {
        
        // 1. Check Redis cache first
        let cache_key = format!("rag:{}:{}", 
            caller_context.session_id, 
            hash_vector(&query_embedding)
        );
        
        if let Ok(cached_result) = self.redis_client.get::<_, String>(&cache_key) {
            return Ok(serde_json::from_str(&cached_result)?);
        }
        
        // 2. Perform vector similarity search
        let similar_docs = self.vector_search(
            &query_embedding,
            &caller_context.jurisdiction,
            urgency_level
        ).await?;
        
        // 3. Rank and filter results
        let ranked_results = self.rank_by_relevance(
            similar_docs,
            &caller_context,
            urgency_level
        )?;
        
        // 4. Cache results for future queries
        let response = LegalContextResponse::new(ranked_results);
        self.cache_response(&cache_key, &response, urgency_level).await?;
        
        Ok(response)
    }
    
    async fn vector_search(
        &mut self,
        embedding: &Vec<f32>,
        jurisdiction: &str,
        urgency: UrgencyLevel
    ) -> Result<Vec<LegalDocument>, RAGError> {
        
        let query = match urgency {
            UrgencyLevel::Emergency => {
                // Prioritize emergency procedures and crisis protocols
                "SELECT * FROM emergency_procedures 
                 WHERE embedding_vector <=> $1 < 0.3
                 ORDER BY urgency_level DESC, embedding_vector <=> $1
                 LIMIT 10"
            },
            UrgencyLevel::Urgent => {
                // Include case law and statutes
                "SELECT * FROM legal_documents 
                 WHERE jurisdiction = $2 AND content_vector <=> $1 < 0.25
                 ORDER BY content_vector <=> $1
                 LIMIT 15"  
            },
            UrgencyLevel::Standard => {
                // Comprehensive search across all document types
                "SELECT * FROM legal_documents 
                 WHERE content_vector <=> $1 < 0.2
                 ORDER BY content_vector <=> $1
                 LIMIT 20"
            }
        };
        
        // Execute query and return results
        self.execute_vector_query(query, embedding, jurisdiction).await
    }
}
```

## Intelligent Caching Strategies

### Cache Warming Procedures
```typescript
interface CacheWarming {
  scheduled_warming: {
    frequency: "every_4_hours",
    target_data: [
      "top_100_legal_queries",
      "jurisdiction_specific_laws", 
      "crisis_intervention_protocols",
      "emergency_contact_directories"
    ]
  };
  
  predictive_warming: {
    algorithm: "query_pattern_analysis",
    trigger_conditions: [
      "call_volume_spike_detected",
      "news_event_correlation",
      "seasonal_legal_trends",
      "jurisdiction_law_changes"
    ]
  };
  
  real_time_warming: {
    trigger: "cache_miss_threshold_exceeded",
    background_fetch: true,
    priority_queue: "urgency_based_ordering"
  };
}
```

### Cache Invalidation Strategy
```typescript
interface CacheInvalidation {
  time_based: {
    emergency_data: "5_minutes",
    legal_precedents: "1_hour", 
    case_law: "24_hours",
    system_config: "7_days"
  };
  
  event_driven: {
    law_changes: "immediate_invalidation",
    court_decisions: "jurisdiction_specific_flush",
    hotline_updates: "service_directory_refresh",
    emergency_alerts: "crisis_protocol_update"
  };
  
  smart_invalidation: {
    dependency_tracking: "cascade_invalidation",
    version_control: "semantic_versioning",
    rollback_capability: "previous_version_fallback"
  };
}
```

## Performance Optimization

### Query Optimization Techniques
```sql
-- Materialized views for common queries
CREATE MATERIALIZED VIEW mv_emergency_hotlines AS
SELECT h.*, p.step_by_step_actions
FROM standardized_hotlines h
JOIN emergency_procedures p ON h.service_type = 'emergency'
WHERE h.availability_schedule->>'24_7' = 'true';

CREATE UNIQUE INDEX idx_mv_emergency_hotlines_id ON mv_emergency_hotlines(id);

-- Refresh strategy
SELECT cron.schedule('refresh-emergency-hotlines', '*/5 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_emergency_hotlines;');
```

### Connection Pooling Configuration
```typescript
interface DatabasePools {
  postgresql: {
    pool_size: 20,
    max_overflow: 30,
    recycle_time: 3600,
    connection_timeout: 10,
    read_replicas: ["pg-read-01", "pg-read-02"],
    write_primary: "pg-write-primary"
  };
  
  redis: {
    pool_size: 50,
    connection_timeout: 5,
    retry_attempts: 3,
    circuit_breaker: {
      failure_threshold: 10,
      timeout_duration: 30,
      recovery_timeout: 60
    }
  };
}
```

## Security & Compliance

### Data Encryption
```typescript
interface SecurityConfiguration {
  encryption_at_rest: {
    postgresql: "AES-256-GCM",
    redis: "AES-256-CBC",
    backup_encryption: "GPG_with_HSM"
  };
  
  encryption_in_transit: {
    client_connections: "TLS_1.3_minimum",
    inter_service: "mTLS_with_certificates",
    database_connections: "SSL_required"
  };
  
  key_management: {
    provider: "Google_Cloud_KMS",
    rotation_frequency: "quarterly",
    access_control: "principle_of_least_privilege"
  };
}
```

### Audit & Compliance Logging
```typescript
interface AuditLogging {
  query_logging: {
    log_level: "all_data_access",
    retention_period: "7_years",
    log_format: "structured_json",
    real_time_monitoring: "suspicious_activity_detection"
  };
  
  compliance_requirements: {
    gdpr: "right_to_be_forgotten_implemented",
    ccpa: "data_deletion_workflows",
    hipaa: "minimum_necessary_principle",
    attorney_client_privilege: "privileged_data_segregation"
  };
}
```

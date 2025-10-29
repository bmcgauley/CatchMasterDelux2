-- Migration Log Table
-- Tracks all migration jobs and their status for the Firebase → Vercel/Payload migration
--
-- Related to: T011 - Migration tracking infrastructure
-- Created: 2025-10-29

-- Drop table if exists (for development/testing)
-- DROP TABLE IF EXISTS migration_log;

-- Create migration_log table
CREATE TABLE IF NOT EXISTS migration_log (
    -- Primary identifier for the migration job
    job_id VARCHAR(255) PRIMARY KEY,

    -- Source reference (Firebase document ID, collection path, etc.)
    source_ref VARCHAR(500) NOT NULL,

    -- Destination reference (Payload ID, Vercel Blob URL, etc.)
    dest_ref VARCHAR(500),

    -- Migration job status
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending',
        'in_progress',
        'completed',
        'failed',
        'skipped',
        'retrying'
    )),

    -- Entity type being migrated
    entity_type VARCHAR(100) NOT NULL CHECK (entity_type IN (
        'user',
        'game_instance',
        'media_asset',
        'pokemon_record',
        'other'
    )),

    -- Error message (if migration failed)
    error_message TEXT,

    -- Error stack trace (for debugging)
    error_stack TEXT,

    -- Number of retry attempts
    attempt_count INTEGER NOT NULL DEFAULT 0,

    -- Maximum retry attempts allowed
    max_attempts INTEGER NOT NULL DEFAULT 3,

    -- Migration batch ID (for grouping related migrations)
    batch_id VARCHAR(255),

    -- Correlation ID (for distributed tracing)
    correlation_id VARCHAR(255),

    -- Source data checksum (for verification)
    source_checksum VARCHAR(64),

    -- Destination data checksum (for verification)
    dest_checksum VARCHAR(64),

    -- Size of data migrated (in bytes)
    data_size_bytes BIGINT,

    -- Additional metadata as JSON
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Migration window (for selective migration)
    source_last_modified TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_migration_log_status ON migration_log(status);
CREATE INDEX IF NOT EXISTS idx_migration_log_entity_type ON migration_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_migration_log_batch_id ON migration_log(batch_id);
CREATE INDEX IF NOT EXISTS idx_migration_log_created_at ON migration_log(created_at);
CREATE INDEX IF NOT EXISTS idx_migration_log_source_ref ON migration_log(source_ref);
CREATE INDEX IF NOT EXISTS idx_migration_log_correlation_id ON migration_log(correlation_id);

-- Composite index for finding failed/retryable jobs
CREATE INDEX IF NOT EXISTS idx_migration_log_retry ON migration_log(status, attempt_count, max_attempts)
    WHERE status IN ('failed', 'retrying');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_migration_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_migration_log_updated_at
    BEFORE UPDATE ON migration_log
    FOR EACH ROW
    EXECUTE FUNCTION update_migration_log_updated_at();

-- Comments for documentation
COMMENT ON TABLE migration_log IS 'Tracks migration jobs from Firebase to Vercel/Payload infrastructure';
COMMENT ON COLUMN migration_log.job_id IS 'Unique identifier for the migration job';
COMMENT ON COLUMN migration_log.source_ref IS 'Reference to source data in Firebase';
COMMENT ON COLUMN migration_log.dest_ref IS 'Reference to destination data in new infrastructure';
COMMENT ON COLUMN migration_log.status IS 'Current status of the migration job';
COMMENT ON COLUMN migration_log.entity_type IS 'Type of entity being migrated';
COMMENT ON COLUMN migration_log.attempt_count IS 'Number of times this migration has been attempted';
COMMENT ON COLUMN migration_log.batch_id IS 'Groups related migrations together';
COMMENT ON COLUMN migration_log.correlation_id IS 'For distributed tracing across systems';

-- Example queries for monitoring

-- Get failed migrations that can be retried
-- SELECT * FROM migration_log
-- WHERE status = 'failed'
--   AND attempt_count < max_attempts
-- ORDER BY created_at DESC;

-- Get migration summary by status
-- SELECT status, entity_type, COUNT(*) as count,
--        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
-- FROM migration_log
-- GROUP BY status, entity_type;

-- Get recent batch progress
-- SELECT batch_id, status, COUNT(*) as count
-- FROM migration_log
-- WHERE batch_id = 'your-batch-id'
-- GROUP BY batch_id, status;

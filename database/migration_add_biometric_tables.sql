-- Migration: Add Biometric Tables
-- This script adds the required tables for the biometric service

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add profile_photo_data column to voters table if it doesn't exist
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS profile_photo_data BYTEA;

-- Create fingerprint_templates table
CREATE TABLE IF NOT EXISTS fingerprint_templates (
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50) UNIQUE NOT NULL,
    template_data BYTEA NOT NULL,
    quality_score FLOAT NOT NULL,
    liveness_score FLOAT,
    features_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    extra_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create verification_logs table
CREATE TABLE IF NOT EXISTS verification_logs (
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50),
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('enrollment', 'verification')),
    success BOOLEAN NOT NULL,
    confidence_score FLOAT,
    quality_score FLOAT,
    liveness_score FLOAT,
    processing_time FLOAT,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for biometric tables
CREATE INDEX IF NOT EXISTS idx_fingerprint_templates_voter_id ON fingerprint_templates(voter_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_templates_is_active ON fingerprint_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_verification_logs_voter_id ON verification_logs(voter_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verification_type ON verification_logs(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_logs_success ON verification_logs(success);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);

-- Add foreign key constraint to fingerprint_templates
ALTER TABLE fingerprint_templates 
ADD CONSTRAINT fk_fingerprint_templates_voter_id 
FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE;

-- Add trigger for updated_at timestamp on fingerprint_templates
CREATE TRIGGER update_fingerprint_templates_updated_at 
    BEFORE UPDATE ON fingerprint_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for updated_at timestamp on verification_logs
CREATE TRIGGER update_verification_logs_updated_at 
    BEFORE UPDATE ON verification_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 'Biometric tables created successfully!' as status;
SELECT COUNT(*) as fingerprint_templates_count FROM fingerprint_templates;
SELECT COUNT(*) as verification_logs_count FROM verification_logs;


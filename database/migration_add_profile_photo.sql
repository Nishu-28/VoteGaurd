-- Migration: Add profile photo support to voters table
-- Run this after the main schema.sql

-- Add profile photo columns to voters table
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS profile_photo_hash VARCHAR(255);

-- Add index for profile photo hash
CREATE INDEX IF NOT EXISTS idx_voters_profile_photo_hash ON voters(profile_photo_hash);

-- Add comment for documentation
COMMENT ON COLUMN voters.profile_photo_url IS 'URL or path to the voter profile photo';
COMMENT ON COLUMN voters.profile_photo_hash IS 'Hash of the profile photo for integrity verification';


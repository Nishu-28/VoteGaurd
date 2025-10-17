-- Migration to add fingerprint_data column to voters table
-- This stores the actual fingerprint image data for comparison

-- Add fingerprint_data column to store the actual fingerprint image
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS fingerprint_data BYTEA;

-- Add index for fingerprint data queries
CREATE INDEX IF NOT EXISTS idx_voters_fingerprint_data ON voters(fingerprint_data);

-- Add comment for documentation
COMMENT ON COLUMN voters.fingerprint_data IS 'Actual fingerprint image data for biometric comparison';

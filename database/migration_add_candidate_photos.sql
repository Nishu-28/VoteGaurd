-- Add candidate photo and party logo columns to candidates table
ALTER TABLE candidates 
ADD COLUMN candidate_photo_path VARCHAR(500),
ADD COLUMN party_image_path VARCHAR(500);

-- Update existing records to have NULL values (which is fine)
-- The columns are nullable so existing data won't be affected

-- Optional: Add comments for documentation
COMMENT ON COLUMN candidates.candidate_photo_path IS 'File path to candidate profile photo';
COMMENT ON COLUMN candidates.party_image_path IS 'File path to party logo/image';
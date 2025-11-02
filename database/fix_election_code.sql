-- Fix migration: Add election_code column to elections table
-- Run this to add the missing election_code column

-- Add election_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'elections' AND column_name = 'election_code'
    ) THEN
        ALTER TABLE elections ADD COLUMN election_code CHAR(6) UNIQUE NOT NULL DEFAULT '';
    END IF;
END $$;

-- Create index for election_code
CREATE INDEX IF NOT EXISTS idx_elections_code ON elections(election_code);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_election_code_trigger ON elections;

-- Recreate the function to generate unique 6-digit election code
CREATE OR REPLACE FUNCTION generate_election_code()
RETURNS CHAR(6) AS $$
DECLARE
    new_code CHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 6-digit code (uppercase letters and numbers)
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM elections WHERE election_code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function to auto-generate election code
CREATE OR REPLACE FUNCTION set_election_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.election_code IS NULL OR NEW.election_code = '' THEN
        NEW.election_code := generate_election_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER set_election_code_trigger
    BEFORE INSERT ON elections
    FOR EACH ROW EXECUTE FUNCTION set_election_code();

-- Update existing elections to have election codes
UPDATE elections 
SET election_code = generate_election_code() 
WHERE election_code IS NULL OR election_code = '';

-- Now make election_code NOT NULL without DEFAULT
ALTER TABLE elections ALTER COLUMN election_code DROP DEFAULT;

-- Recreate the voting_summary view with election_code
DROP VIEW IF EXISTS voting_summary CASCADE;
CREATE OR REPLACE VIEW voting_summary AS
SELECT 
    e.id as election_id,
    e.name as election_name,
    e.election_code,
    c.id as candidate_id,
    c.name as candidate_name,
    c.party as candidate_party,
    COUNT(v.id) as vote_count,
    ROUND(COUNT(v.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM votes WHERE election_id = e.id), 0), 2) as percentage
FROM elections e
LEFT JOIN candidates c ON c.election_id = e.id AND c.is_active = true
LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = e.id
WHERE e.is_active = true
GROUP BY e.id, e.name, e.election_code, c.id, c.name, c.party
ORDER BY e.id DESC, vote_count DESC;

-- Verify the fix
SELECT 'Election code column added successfully!' as status;
SELECT id, name, election_code, status, is_active FROM elections;

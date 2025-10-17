-- Migration script to add voter_name to votes table
-- Run this script to update your existing database

-- Step 1: Add the voter_name column to the votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_name VARCHAR(100);

-- Step 2: Create the function to automatically populate voter_name
CREATE OR REPLACE FUNCTION populate_voter_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically fetch and set the voter_name from the voters table
    SELECT full_name INTO NEW.voter_name 
    FROM voters 
    WHERE id = NEW.voter_id;
    
    -- If voter not found, raise an error
    IF NEW.voter_name IS NULL THEN
        RAISE EXCEPTION 'Voter with id % not found', NEW.voter_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger to automatically populate voter_name on vote insertion
DROP TRIGGER IF EXISTS populate_voter_name_trigger ON votes;
CREATE TRIGGER populate_voter_name_trigger
    BEFORE INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION populate_voter_name();

-- Step 4: Add index for voter_name
CREATE INDEX IF NOT EXISTS idx_votes_voter_name ON votes(voter_name);

-- Step 5: Update existing votes with voter names (if any exist)
UPDATE votes 
SET voter_name = v.full_name 
FROM voters v 
WHERE votes.voter_id = v.id 
AND votes.voter_name IS NULL;

-- Step 6: Make voter_name NOT NULL after populating existing data
ALTER TABLE votes ALTER COLUMN voter_name SET NOT NULL;

-- Verification query to check the migration
SELECT 
    v.id as vote_id,
    v.voter_id,
    v.voter_name,
    vo.full_name as voter_full_name,
    CASE 
        WHEN v.voter_name = vo.full_name THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM votes v
JOIN voters vo ON v.voter_id = vo.id
ORDER BY v.id;





-- Migration: Add Elections Support
-- This migration adds elections table and modifies existing tables to support multiple elections

-- Create elections table
CREATE TABLE IF NOT EXISTS elections (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_election_dates CHECK (end_date > start_date)
);

-- Add election_id to candidates table to link candidates to specific elections
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS election_id BIGINT REFERENCES elections(id) ON DELETE CASCADE;

-- Add eligible_elections to voters table to store which elections they can vote in
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS eligible_elections JSONB DEFAULT '[]'::jsonb;

-- Add election_id to votes table to track which election the vote is for
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS election_id BIGINT REFERENCES elections(id) ON DELETE CASCADE;

-- Update the unique constraint on votes to allow multiple votes per voter (for different elections)
-- First drop the existing constraint
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_voter_id_key;

-- Add new unique constraint to ensure one vote per voter per election
ALTER TABLE votes 
ADD CONSTRAINT unique_voter_election UNIQUE(voter_id, election_id);

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_dates ON elections(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_candidates_election_id ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election_id ON votes(election_id);
CREATE INDEX IF NOT EXISTS idx_voters_eligible_elections ON voters USING gin(eligible_elections);

-- Add trigger for elections updated_at
CREATE TRIGGER update_elections_updated_at 
    BEFORE UPDATE ON elections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update the voting_summary view to include election information
CREATE OR REPLACE VIEW voting_summary AS
SELECT 
    e.id as election_id,
    e.name as election_name,
    c.id as candidate_id,
    c.name as candidate_name,
    c.party as candidate_party,
    COUNT(v.id) as vote_count,
    ROUND(COUNT(v.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM votes WHERE election_id = e.id), 0), 2) as percentage
FROM elections e
LEFT JOIN candidates c ON e.id = c.election_id AND c.is_active = true
LEFT JOIN votes v ON c.id = v.candidate_id AND v.election_id = e.id
WHERE e.is_active = true
GROUP BY e.id, e.name, c.id, c.name, c.party
ORDER BY e.id, vote_count DESC;

-- Update voter_statistics view to include election-specific statistics
CREATE OR REPLACE VIEW voter_statistics AS
SELECT 
    e.id as election_id,
    e.name as election_name,
    COUNT(CASE WHEN v.eligible_elections @> jsonb_build_array(e.id::text) THEN 1 END) as eligible_voters,
    COUNT(CASE WHEN votes.voter_id IS NOT NULL THEN 1 END) as voters_who_voted,
    ROUND(COUNT(CASE WHEN votes.voter_id IS NOT NULL THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN v.eligible_elections @> jsonb_build_array(e.id::text) THEN 1 END), 0), 2) as voting_percentage
FROM elections e
CROSS JOIN voters v
LEFT JOIN votes ON votes.voter_id = v.id AND votes.election_id = e.id
WHERE e.is_active = true AND v.is_active = true
GROUP BY e.id, e.name
ORDER BY e.id;

-- Create a function to check if a voter is eligible for an election
CREATE OR REPLACE FUNCTION is_voter_eligible(voter_id_param BIGINT, election_id_param BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    eligible BOOLEAN := FALSE;
BEGIN
    -- Check if the election_id exists in the voter's eligible_elections array
    -- eligible_elections can be numbers [1,5] or strings ["1","5"]
    -- We check both formats: as number and as string
    SELECT (
        (v.eligible_elections @> jsonb_build_array(election_id_param::bigint)) OR
        (v.eligible_elections @> jsonb_build_array(election_id_param::text))
    )
    INTO eligible
    FROM voters v
    WHERE v.id = voter_id_param AND v.is_active = true;
    
    RETURN COALESCE(eligible, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create a function to add a voter to an election's eligible list
CREATE OR REPLACE FUNCTION add_voter_to_election(voter_id BIGINT, election_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if voter and election exist
    IF NOT EXISTS (SELECT 1 FROM voters WHERE id = voter_id AND is_active = true) THEN
        RAISE EXCEPTION 'Voter with id % not found or inactive', voter_id;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM elections WHERE id = election_id AND is_active = true) THEN
        RAISE EXCEPTION 'Election with id % not found or inactive', election_id;
    END IF;
    
    -- Add election to voter's eligible elections if not already present
    UPDATE voters 
    SET eligible_elections = eligible_elections || jsonb_build_array(election_id::text)
    WHERE id = voter_id 
    AND NOT (eligible_elections @> jsonb_build_array(election_id::text));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to remove a voter from an election's eligible list
CREATE OR REPLACE FUNCTION remove_voter_from_election(voter_id BIGINT, election_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE voters 
    SET eligible_elections = eligible_elections - election_id::text
    WHERE id = voter_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get active elections for a voter
CREATE OR REPLACE FUNCTION get_voter_active_elections(voter_id BIGINT)
RETURNS TABLE(
    election_id BIGINT,
    election_name VARCHAR(200),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20),
    has_voted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.start_date,
        e.end_date,
        e.status,
        (votes.id IS NOT NULL) as has_voted
    FROM elections e
    INNER JOIN voters v ON v.eligible_elections @> jsonb_build_array(e.id::text)
    LEFT JOIN votes ON votes.voter_id = v.id AND votes.election_id = e.id
    WHERE v.id = voter_id 
    AND v.is_active = true 
    AND e.is_active = true
    AND e.status IN ('ACTIVE', 'UPCOMING')
    ORDER BY e.start_date;
END;
$$ LANGUAGE plpgsql;

-- Update the populate_voter_name function to handle election-specific votes
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
    
    -- Verify voter is eligible for this election (only if election_id is not NULL)
    IF NEW.election_id IS NOT NULL THEN
        IF NOT is_voter_eligible(NEW.voter_id, NEW.election_id) THEN
            RAISE EXCEPTION 'Voter with id % is not eligible for election %', NEW.voter_id, NEW.election_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for new tables and functions
-- GRANT ALL PRIVILEGES ON elections TO voteguard_user;
-- GRANT EXECUTE ON FUNCTION is_voter_eligible(BIGINT, BIGINT) TO voteguard_user;
-- GRANT EXECUTE ON FUNCTION add_voter_to_election(BIGINT, BIGINT) TO voteguard_user;
-- GRANT EXECUTE ON FUNCTION remove_voter_from_election(BIGINT, BIGINT) TO voteguard_user;
-- GRANT EXECUTE ON FUNCTION get_voter_active_elections(BIGINT) TO voteguard_user;

-- Insert a sample election for testing (optional)
INSERT INTO elections (name, description, start_date, end_date, status) 
VALUES 
    ('Student Council Election 2024', 'Annual student council election for academic year 2024-2025', 
     '2024-11-01 09:00:00', '2024-11-01 17:00:00', 'UPCOMING')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE elections IS 'Stores election information including dates and status';
COMMENT ON COLUMN elections.eligible_elections IS 'JSONB array of election IDs that this voter is eligible to vote in';
COMMENT ON FUNCTION is_voter_eligible(BIGINT, BIGINT) IS 'Checks if a voter is eligible to vote in a specific election';
COMMENT ON FUNCTION add_voter_to_election(BIGINT, BIGINT) IS 'Adds a voter to an elections eligible voters list';
COMMENT ON FUNCTION remove_voter_from_election(BIGINT, BIGINT) IS 'Removes a voter from an elections eligible voters list';
COMMENT ON FUNCTION get_voter_active_elections(BIGINT) IS 'Returns all active elections that a voter is eligible for';
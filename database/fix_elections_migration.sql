-- Fix elections migration - Drop and recreate views properly

-- Drop existing views first
DROP VIEW IF EXISTS voting_summary;
DROP VIEW IF EXISTS voter_statistics;

-- Recreate voting_summary view with election information
CREATE VIEW voting_summary AS
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

-- Recreate voter_statistics view with election-specific statistics
CREATE VIEW voter_statistics AS
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

-- Fix the comment on the correct table/column
COMMENT ON COLUMN voters.eligible_elections IS 'JSONB array of election IDs that this voter is eligible to vote in';
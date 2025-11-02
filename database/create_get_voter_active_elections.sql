-- Create or replace the get_voter_active_elections function
-- This function returns all active elections that a voter is eligible for

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

-- Verify the function was created
SELECT 'Function get_voter_active_elections created successfully!' as status;



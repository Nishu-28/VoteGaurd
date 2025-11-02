-- Fix is_voter_eligible function to properly check JSONB arrays
-- The ? operator checks for keys in objects, but eligible_elections is an array
-- Use @> (contains) operator instead

-- Drop existing function first
DROP FUNCTION IF EXISTS is_voter_eligible(BIGINT, BIGINT);

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

-- Fix the add_voter_to_election function to use @> instead of ?
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

-- Fix views that use ? operator with arrays
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

-- Fix get_voter_active_elections function
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

-- Verify the function was updated
SELECT 'Function is_voter_eligible updated successfully!' as status;


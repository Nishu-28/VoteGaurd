-- Create or replace the is_voter_eligible function
-- This function checks if a voter is eligible for a specific election

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

-- Verify the function was created
SELECT 'Function is_voter_eligible created successfully!' as status;


-- Fix OTP generation function to use UTC explicitly
-- Neon databases are in UTC, so we need to store UTC timestamps
-- The TIMESTAMP column is timezone-naive, so we store UTC time as-is
CREATE OR REPLACE FUNCTION generate_election_otp(election_id_param BIGINT)
RETURNS CHAR(6) AS $$
DECLARE
    new_otp CHAR(6);
    expiry_time TIMESTAMP;
    current_utc TIMESTAMP;
BEGIN
    -- Generate OTP
    new_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Get current UTC time explicitly
    -- Neon DB uses UTC, so NOW() at UTC timezone gives us UTC
    current_utc := (NOW() AT TIME ZONE 'UTC')::TIMESTAMP;
    
    -- Calculate expiry time as UTC timestamp + 2 minutes
    expiry_time := current_utc + INTERVAL '2 minutes';
    
    -- Update election with new OTP and expiration (stored as UTC timestamp)
    UPDATE elections 
    SET election_otp = new_otp,
        otp_expires_at = expiry_time
    WHERE id = election_id_param;
    
    -- Log for debugging
    RAISE NOTICE 'Generated OTP % for election %, expires at % UTC (current UTC: %)', 
        new_otp, election_id_param, expiry_time, current_utc;
    
    RETURN new_otp;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
SELECT 'OTP function updated to ensure fresh timestamps!' as status;

-- Test the function (optional - uncomment to test)
-- SELECT generate_election_otp(5);


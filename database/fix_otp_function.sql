-- Fix OTP generation function
CREATE OR REPLACE FUNCTION generate_election_otp(election_id_param BIGINT)
RETURNS CHAR(6) AS $$
DECLARE
    new_otp CHAR(6);
    current_ts TIMESTAMP;
BEGIN
    current_ts := NOW();
    new_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    UPDATE elections 
    SET election_otp = new_otp,
        otp_expires_at = current_ts + INTERVAL '2 minutes'
    WHERE id = election_id_param;
    
    RETURN new_otp;
END;
$$ LANGUAGE plpgsql;

SELECT 'OTP function created successfully!' as status;

-- Migration: Remove voting stations and restructure for center-based voting
-- This migration removes the station_code dependency and adds election setup capability

-- Step 1: Remove station_code requirement from votes table
ALTER TABLE votes ALTER COLUMN station_code DROP NOT NULL;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_station_code_fkey;

-- Step 2: Add center_location to votes for tracking where vote was cast
ALTER TABLE votes ADD COLUMN IF NOT EXISTS center_location VARCHAR(255);

-- Step 3: Add election_otp and otp_expires_at to elections table for center setup
ALTER TABLE elections ADD COLUMN IF NOT EXISTS election_otp CHAR(6);
ALTER TABLE elections ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
ALTER TABLE elections ADD COLUMN IF NOT EXISTS active_center_location VARCHAR(255);

-- Step 4: Create function to generate time-based OTP (changes every 2 minutes)
CREATE OR REPLACE FUNCTION generate_election_otp(election_id_param BIGINT)
RETURNS CHAR(6) AS $$
DECLARE
    new_otp CHAR(6);
    current_time TIMESTAMP;
BEGIN
    current_time := NOW();
    
    -- Generate 6-digit numeric OTP
    new_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Update election with new OTP and expiration (2 minutes from now)
    UPDATE elections 
    SET election_otp = new_otp,
        otp_expires_at = current_time + INTERVAL '2 minutes'
    WHERE id = election_id_param;
    
    RETURN new_otp;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to validate election OTP
CREATE OR REPLACE FUNCTION validate_election_otp(election_id_param BIGINT, otp_param CHAR(6))
RETURNS BOOLEAN AS $$
DECLARE
    stored_otp CHAR(6);
    expiry_time TIMESTAMP;
    is_valid BOOLEAN;
BEGIN
    SELECT election_otp, otp_expires_at 
    INTO stored_otp, expiry_time
    FROM elections 
    WHERE id = election_id_param;
    
    -- Check if OTP matches and is not expired
    IF stored_otp = otp_param AND expiry_time > NOW() THEN
        is_valid := TRUE;
    ELSE
        is_valid := FALSE;
    END IF;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add index for OTP lookup
CREATE INDEX IF NOT EXISTS idx_elections_otp ON elections(election_otp) WHERE election_otp IS NOT NULL;

-- Step 7: Generate OTPs for existing active elections
UPDATE elections 
SET election_otp = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
    otp_expires_at = NOW() + INTERVAL '2 minutes'
WHERE is_active = true AND status IN ('UPCOMING', 'ACTIVE');

-- Step 8: Update voters to have eligible_elections if not set
UPDATE voters 
SET eligible_elections = jsonb_build_array(
    (SELECT id FROM elections WHERE is_active = true ORDER BY start_date LIMIT 1)
)
WHERE eligible_elections IS NULL OR eligible_elections = '[]'::jsonb;

-- Verification
SELECT 'Center-based voting migration completed successfully!' as status;
SELECT id, name, election_code, election_otp, otp_expires_at, active_center_location 
FROM elections 
WHERE is_active = true;

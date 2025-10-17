-- VoteGuard Database Schema
-- PostgreSQL Database Schema for Secure Voting System

-- Create database (run this separately if needed)
-- CREATE DATABASE voteguard;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Voters table (Center-Based Voting System)
CREATE TABLE IF NOT EXISTS voters (
    id BIGSERIAL PRIMARY KEY,
    voter_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    fingerprint_hash VARCHAR(255) UNIQUE,
    extra_field VARCHAR(100), -- DOB, dept, etc. for secondary validation
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(20) NOT NULL DEFAULT 'VOTER' CHECK (role IN ('VOTER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    party VARCHAR(100) NOT NULL,
    description TEXT,
    candidate_number INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voting Stations table
CREATE TABLE IF NOT EXISTS voting_stations (
    id BIGSERIAL PRIMARY KEY,
    station_code VARCHAR(50) UNIQUE NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes table (Center-Based Voting System)
CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    voter_id BIGINT NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    voter_name VARCHAR(100) NOT NULL, -- Automatically populated from voters table
    candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    station_code VARCHAR(50) NOT NULL REFERENCES voting_stations(station_code),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    fingerprint_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Ensure one vote per voter
    UNIQUE(voter_id)
);

-- Audit log table for security
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES voters(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voters_voter_id ON voters(voter_id);
CREATE INDEX IF NOT EXISTS idx_voters_email ON voters(email);
CREATE INDEX IF NOT EXISTS idx_voters_fingerprint_hash ON voters(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_voters_has_voted ON voters(has_voted);
CREATE INDEX IF NOT EXISTS idx_voters_extra_field ON voters(extra_field);
CREATE INDEX IF NOT EXISTS idx_voting_stations_code ON voting_stations(station_code);
CREATE INDEX IF NOT EXISTS idx_voting_stations_locked ON voting_stations(is_locked);
CREATE INDEX IF NOT EXISTS idx_candidates_active ON candidates(is_active);
CREATE INDEX IF NOT EXISTS idx_candidates_party ON candidates(party);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_name ON votes(voter_name);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_station_code ON votes(station_code);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_voters_updated_at 
    BEFORE UPDATE ON voters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at 
    BEFORE UPDATE ON candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voting_stations_updated_at 
    BEFORE UPDATE ON voting_stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically populate voter_name when inserting a vote
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

-- Trigger to automatically populate voter_name on vote insertion
CREATE TRIGGER populate_voter_name_trigger
    BEFORE INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION populate_voter_name();

-- Views for reporting
CREATE OR REPLACE VIEW voting_summary AS
SELECT 
    c.id as candidate_id,
    c.name as candidate_name,
    c.party as candidate_party,
    COUNT(v.id) as vote_count,
    ROUND(COUNT(v.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM votes), 0), 2) as percentage
FROM candidates c
LEFT JOIN votes v ON c.id = v.candidate_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.party
ORDER BY vote_count DESC;

CREATE OR REPLACE VIEW voter_statistics AS
SELECT 
    COUNT(*) as total_voters,
    COUNT(CASE WHEN has_voted = true THEN 1 END) as voters_who_voted,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_voters,
    ROUND(COUNT(CASE WHEN has_voted = true THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN is_active = true THEN 1 END), 0), 2) as voting_percentage
FROM voters;

-- Security: Create a function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id BIGINT,
    p_action VARCHAR(100),
    p_resource VARCHAR(100),
    p_ip_address INET,
    p_user_agent TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, details)
    VALUES (p_user_id, p_action, p_resource, p_ip_address, p_user_agent, p_details);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voteguard_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voteguard_user;



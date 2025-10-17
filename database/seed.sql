-- VoteGuard Database Seed Data
-- Sample data for testing and development

-- Insert sample candidates
INSERT INTO candidates (name, party, description, candidate_number, is_active) VALUES
('John Smith', 'Democratic Party', 'Experienced politician with 10 years in public service. Focus on healthcare and education reform.', 1, true),
('Sarah Johnson', 'Republican Party', 'Business leader and former mayor. Strong advocate for economic growth and infrastructure.', 2, true),
('Michael Chen', 'Green Party', 'Environmental activist and community organizer. Committed to sustainable development.', 3, true),
('Emily Rodriguez', 'Independent', 'Tech entrepreneur and civic leader. Focus on digital transformation and transparency.', 4, true),
('David Wilson', 'Progressive Party', 'Labor union leader and social justice advocate. Champion of workers rights.', 5, true);

-- Insert voting stations
INSERT INTO voting_stations (station_code, is_locked, location) VALUES
('STATION_001', false, 'Main Campus - Building A, Room 101'),
('STATION_002', false, 'Main Campus - Building B, Room 205'),
('STATION_003', true, 'North Campus - Building C, Room 301'),
('STATION_004', false, 'South Campus - Building D, Room 401'),
('STATION_005', true, 'East Campus - Building E, Room 501');

-- Insert sample voters (Center-Based Voting System - No passwords, fingerprint-only auth)
-- Note: In production, these should be created through the admin registration process
INSERT INTO voters (voter_id, full_name, email, fingerprint_hash, extra_field, has_voted, is_active, role) VALUES
('ADMIN001', 'System Administrator', 'admin@voteguard.com', 'admin_fingerprint_hash_12345', '1990-01-01', false, true, 'ADMIN'),
('VOTER001', 'Alice Johnson', 'alice.johnson@email.com', 'fingerprint_hash_alice_001', '1995-05-15', false, true, 'VOTER'),
('VOTER002', 'Bob Smith', 'bob.smith@email.com', 'fingerprint_hash_bob_002', '1992-08-22', false, true, 'VOTER'),
('VOTER003', 'Carol Davis', 'carol.davis@email.com', 'fingerprint_hash_carol_003', '1998-03-10', false, true, 'VOTER'),
('VOTER004', 'David Brown', 'david.brown@email.com', 'fingerprint_hash_david_004', '1991-12-05', false, true, 'VOTER'),
('VOTER005', 'Eva Martinez', 'eva.martinez@email.com', 'fingerprint_hash_eva_005', '1996-07-18', false, true, 'VOTER'),
('VOTER006', 'Frank Wilson', 'frank.wilson@email.com', 'fingerprint_hash_frank_006', '1993-11-30', false, true, 'VOTER'),
('VOTER007', 'Grace Lee', 'grace.lee@email.com', 'fingerprint_hash_grace_007', '1997-04-12', false, true, 'VOTER'),
('VOTER008', 'Henry Taylor', 'henry.taylor@email.com', 'fingerprint_hash_henry_008', '1994-09-25', false, true, 'VOTER'),
('VOTER009', 'Iris Anderson', 'iris.anderson@email.com', 'fingerprint_hash_iris_009', '1999-01-08', false, true, 'VOTER'),
('VOTER010', 'Jack Thompson', 'jack.thompson@email.com', 'fingerprint_hash_jack_010', '1990-06-14', false, true, 'VOTER');

-- Insert some sample votes (for testing results functionality)
-- Note: In production, votes should only be created through the voting process
INSERT INTO votes (voter_id, candidate_id, station_code, timestamp, ip_address, user_agent, fingerprint_verified) VALUES
(2, 1, 'STATION_001', '2024-01-15 10:30:00', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', true),
(3, 2, 'STATION_002', '2024-01-15 11:15:00', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', true),
(4, 1, 'STATION_001', '2024-01-15 12:00:00', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', true),
(5, 3, 'STATION_004', '2024-01-15 13:45:00', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', true),
(6, 2, 'STATION_002', '2024-01-15 14:20:00', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', true);

-- Update voters who have voted
UPDATE voters SET has_voted = true WHERE id IN (2, 3, 4, 5, 6);

-- Insert some audit log entries
INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, details) VALUES
(1, 'FINGERPRINT_LOGIN', 'AUTH', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"login_time": "2024-01-15T09:00:00Z", "method": "fingerprint"}'),
(2, 'VOTE_CAST', 'VOTE', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"candidate_id": 1, "station_code": "STATION_001", "timestamp": "2024-01-15T10:30:00Z", "fingerprint_verified": true}'),
(3, 'VOTE_CAST', 'VOTE', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '{"candidate_id": 2, "station_code": "STATION_002", "timestamp": "2024-01-15T11:15:00Z", "fingerprint_verified": true}'),
(4, 'VOTE_CAST', 'VOTE', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', '{"candidate_id": 1, "station_code": "STATION_001", "timestamp": "2024-01-15T12:00:00Z", "fingerprint_verified": true}'),
(5, 'VOTE_CAST', 'VOTE', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', '{"candidate_id": 3, "station_code": "STATION_004", "timestamp": "2024-01-15T13:45:00Z", "fingerprint_verified": true}'),
(6, 'VOTE_CAST', 'VOTE', '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', '{"candidate_id": 2, "station_code": "STATION_002", "timestamp": "2024-01-15T14:20:00Z", "fingerprint_verified": true}');

-- Create a view for quick statistics
CREATE OR REPLACE VIEW current_voting_stats AS
SELECT 
    (SELECT COUNT(*) FROM voters WHERE is_active = true) as total_eligible_voters,
    (SELECT COUNT(*) FROM voters WHERE has_voted = true) as total_votes_cast,
    (SELECT COUNT(*) FROM candidates WHERE is_active = true) as total_candidates,
    ROUND(
        (SELECT COUNT(*) FROM voters WHERE has_voted = true) * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM voters WHERE is_active = true), 0), 2
    ) as voting_percentage;

-- Display current statistics
SELECT * FROM current_voting_stats;
SELECT * FROM voting_summary;
SELECT * FROM voter_statistics;



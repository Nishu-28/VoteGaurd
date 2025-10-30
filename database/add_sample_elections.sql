-- Add sample elections for testing
INSERT INTO elections (name, description, start_date, end_date, status, is_active) VALUES
('Student Council Election 2025', 'Annual student council election for academic year 2025-2026', 
 '2025-11-01 09:00:00', '2025-11-01 17:00:00', 'UPCOMING', true),
('Class Representative Election', 'Election for class representatives across all departments', 
 '2025-10-15 10:00:00', '2025-10-15 16:00:00', 'COMPLETED', true),
('Faculty Senate Election', 'Election for faculty senate members', 
 '2025-12-01 08:00:00', '2025-12-01 18:00:00', 'UPCOMING', true),
('Sports Committee Election', 'Election for sports committee members', 
 '2025-11-15 11:00:00', '2025-11-15 15:00:00', 'UPCOMING', true)
ON CONFLICT DO NOTHING;

-- Update existing voters to be eligible for all elections
UPDATE voters 
SET eligible_elections = '["1","2","3","4"]'::jsonb 
WHERE is_active = true;
-- VoteGuard PostgreSQL Setup Script
-- This script sets up the VoteGuard database with proper schema and data

-- Connect to PostgreSQL as superuser and run:
-- psql -U postgres -c "CREATE DATABASE voteguard;"
-- psql -U postgres -d voteguard -f database/setup-postgres.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database schema
\i database/schema.sql

-- Seed initial data
\i database/seed.sql

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_timestamp_desc ON votes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_desc ON audit_logs(timestamp DESC);

-- Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_voters FROM voters;
SELECT COUNT(*) as total_candidates FROM candidates;
SELECT COUNT(*) as total_votes FROM votes;

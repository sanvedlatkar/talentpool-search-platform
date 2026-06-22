-- ==========================================
-- TALENTPOOL SEARCH PLATFORM
-- DATABASE SCHEMA
-- ==========================================

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CANDIDATES
-- ==========================================

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY,

    name VARCHAR,
    email VARCHAR,
    phone VARCHAR,

    linkedin_url TEXT,
    github_url TEXT,

    location VARCHAR,

    years_experience NUMERIC,
    latest_job_title VARCHAR,

    skills TEXT[],

    resume_url TEXT,

    processing_status VARCHAR DEFAULT 'UPLOADED',

    current_title TEXT,
    experience_years INTEGER,

    raw_json JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- CANDIDATE SKILLS
-- ==========================================

CREATE TABLE IF NOT EXISTS candidate_skills (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    candidate_id UUID REFERENCES candidates(id)
        ON DELETE CASCADE,

    skill TEXT
);

-- ==========================================
-- CANDIDATE PROJECTS
-- ==========================================

CREATE TABLE IF NOT EXISTS candidate_projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    candidate_id UUID REFERENCES candidates(id)
        ON DELETE CASCADE,

    project_name TEXT,
    technologies TEXT[],

    description TEXT,
    duration TEXT
);

-- ==========================================
-- CANDIDATE CERTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS candidate_certifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    candidate_id UUID REFERENCES candidates(id)
        ON DELETE CASCADE,

    certification_name TEXT,
    provider TEXT,
    status TEXT
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_candidates_name
ON candidates(name);

CREATE INDEX IF NOT EXISTS idx_candidates_current_title
ON candidates(current_title);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate_id
ON candidate_skills(candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill
ON candidate_skills(skill);

CREATE INDEX IF NOT EXISTS idx_candidate_projects_candidate_id
ON candidate_projects(candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_certifications_candidate_id
ON candidate_certifications(candidate_id);

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidates_updated_at
ON candidates;

CREATE TRIGGER trg_candidates_updated_at
BEFORE UPDATE
ON candidates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
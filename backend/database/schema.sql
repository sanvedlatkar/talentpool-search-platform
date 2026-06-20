-- =====================================================
-- TalentPool Search Platform Database Schema
-- =====================================================

-- Candidates Table

CREATE TABLE candidates (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255),

    email VARCHAR(255),

    phone VARCHAR(50),

    linkedin_url TEXT,

    location VARCHAR(255),

    years_experience NUMERIC(4,1),

    latest_job_title VARCHAR(255),

    skills TEXT[],

    resume_url TEXT,

    processing_status VARCHAR(50),

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);



-- Processing History Table

CREATE TABLE processing_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID REFERENCES candidates(id),

    status VARCHAR(50),

    message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);



-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_candidate_location
ON candidates(location);


CREATE INDEX idx_candidate_experience
ON candidates(years_experience);


CREATE INDEX idx_candidate_skills
ON candidates
USING GIN(skills);

ALTER TABLE candidates
ENABLE ROW LEVEL SECURITY;

ALTER TABLE processing_history
ENABLE ROW LEVEL SECURITY;

CREATE POLICY deny_all_candidates
ON candidates
FOR ALL
TO public
USING (false);

CREATE POLICY deny_all_processing_history
ON processing_history
FOR ALL
TO public
USING (false);
# Database Design

## candidates

Stores candidate information extracted from resumes.

Fields:

- id
- name
- email
- phone
- linkedin_url
- location
- years_experience
- latest_job_title
- skills
- resume_url
- processing_status
- created_at
- updated_at

---

## processing_history

Stores processing events and errors for operational troubleshooting.

Examples:

- UPLOADED
- PROCESSING
- AI_COMPLETE
- COMPLETED
- FAILED_AI
- FAILED_TEXT_EXTRACTION

---

## Indexing Strategy

### idx_candidate_location

Improves recruiter searches by location.

### idx_candidate_experience

Improves experience-based filtering.

### idx_candidate_skills

GIN index enables efficient searching within PostgreSQL arrays.
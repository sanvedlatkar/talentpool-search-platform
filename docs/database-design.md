# TalentPulse Database Design

## Database

Supabase PostgreSQL

---

# candidates

Stores primary candidate information.

| Column | Type |
|----------|----------|
| id | UUID |
| name | VARCHAR |
| email | VARCHAR |
| phone | VARCHAR |
| linkedin_url | TEXT |
| github_url | TEXT |
| location | VARCHAR |
| current_title | TEXT |
| experience_years | INTEGER |
| resume_url | TEXT |
| processing_status | VARCHAR |
| raw_json | JSONB |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Primary Key:

```sql
id
```

---

# candidate_skills

Stores extracted skills.

| Column | Type |
|----------|----------|
| id | BIGINT |
| candidate_id | UUID |
| skill | TEXT |

Relationship:

```sql
candidate_id
→ candidates.id
```

One candidate can have many skills.

---

# candidate_projects

Stores extracted projects.

| Column | Type |
|----------|----------|
| id | BIGINT |
| candidate_id | UUID |
| project_name | TEXT |
| description | TEXT |
| duration | TEXT |
| technologies | TEXT[] |

Relationship:

```sql
candidate_id
→ candidates.id
```

One candidate can have many projects.

---

# candidate_certifications

Stores extracted certifications.

| Column | Type |
|----------|----------|
| id | BIGINT |
| candidate_id | UUID |
| certification_name | TEXT |
| provider | TEXT |
| status | TEXT |

Relationship:

```sql
candidate_id
→ candidates.id
```

One candidate can have many certifications.

---

# Relationships

```text
candidates
│
├── candidate_skills
│
├── candidate_projects
│
└── candidate_certifications
```

---

# Design Decisions

## Why Separate Tables?

Avoid storing arrays inside candidate records.

Benefits:

- Easier searching
- Better indexing
- Relational design
- Scalable

---

# Storage Flow

Resume Upload

↓

S3

↓

SQS

↓

Resume Processor Lambda

↓

Groq Parsing

↓

Supabase

---

# Future Enhancements

- Candidate scoring
- Resume versions
- Education table
- Work experience table
- Recruiter authentication
- Audit logging
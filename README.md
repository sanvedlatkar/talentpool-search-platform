# TalentPulse – AI-Powered Resume Parsing & Candidate Search Platform

## Overview

TalentPulse is a AI-powered recruitment platform that automates resume ingestion, parsing, storage, and candidate search.

Recruiters can upload resumes in PDF or DOCX format, which are processed automatically using Groq LLM. Extracted candidate information such as skills, certifications, projects, experience, and contact details are stored in Supabase and made searchable through a recruiter dashboard.

The platform is built entirely on AWS serverless services and follows modern cloud architecture principles including asynchronous processing, least-privilege IAM permissions, secure API design, and static website hosting through CloudFront.

---

# Live Demo

The application is deployed and accessible through Amazon CloudFront.

### Production URL


https://d2gw6fq8z9ugaw.cloudfront.net



## Available Pages

### Dashboard


https://d2gw6fq8z9ugaw.cloudfront.net

Displays all processed candidates and provides search functionality.

---

### Resume Upload


https://d2gw6fq8z9ugaw.cloudfront.net/upload.html


Allows recruiters to upload candidate resumes.

---

### Candidate Details

```text
https://d2gw6fq8z9ugaw.cloudfront.net
```

Displays complete candidate information including:

* Contact Information
* Skills
* Certifications
* Projects
* Experience

---

# Features

## Resume Upload

* PDF support
* DOCX support
* Direct S3 uploads using Presigned URLs
* Secure upload workflow

---

## AI Resume Parsing

* Resume text extraction
* PII scrubbing
* Groq LLM integration
* Structured JSON generation

---

## Candidate Management

* Candidate profile creation
* Skills extraction
* Certification extraction
* Project extraction
* Experience extraction

---

## Candidate Search

Search candidates using:

* Skill
* Location
* Experience

---

## Recruiter Dashboard

* Candidate listing
* Candidate profile page
* Resume upload page
* Search filters
* Responsive UI

---

# Architecture

```text
Frontend (HTML/CSS/JavaScript)

        │
        ▼

CloudFront CDN

        │
        ▼

API Gateway

        │
        ▼

API Handler Lambda

        │
        ▼

Amazon S3

        │
        ▼

Amazon SQS

        │
        ▼

Resume Processor Lambda

        │
        ▼

Groq LLM

        │
        ▼

Supabase PostgreSQL
```

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript

---

## Backend

* AWS Lambda
* AWS API Gateway
* Amazon S3
* Amazon SQS

---

## AI

* Groq API
* Llama 3.3 70B Versatile

---

## Database

* Supabase PostgreSQL

---

## Hosting

* Amazon S3
* Amazon CloudFront

---

# Project Structure

```text
TalentPulse/

├── frontend/
│   ├── index.html
│   ├── upload.html
│   ├── candidate.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   ├── upload.css
│   │   └── candidate.css
│   │
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── dashboard.js
│   │   ├── upload.js
│   │   └── candidate.js
│   │
│   └── assets/
│
├── api-handler-lambda/
│   ├── lambda_function.py
│   ├── config.py
│   ├── requirements.txt
│   └── services/
│
├── resume-processor-lambda/
│   ├── lambda_function.py
│   ├── config.py
│   ├── requirements.txt
│   └── services/
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── api-design.md
│   ├── database-design.md
│   └── sqs-design.md
│
└── README.md
```

---

# Running the Application

## Option 1 – Use the Deployed Version

Open:

```text
https://d2gw6fq8z9ugaw.cloudfront.net
```

No installation required.

---

## Option 2 – Run Frontend Locally

Navigate to frontend folder:

```bash
cd frontend
```

Start local server:

```bash
python -m http.server 8000
```

Open browser:

```text
http://localhost:8000
```

---

## Option 3 – VS Code Live Server

Install:

```text
Live Server Extension
```

Right click:

```text
index.html
```

Select:

```text
Open with Live Server
```

---

# Backend Components

## API Handler Lambda

Responsibilities:

* Generate Presigned Upload URL
* Upload Completion API
* Candidate Search API
* Candidate Detail API
* Health Check API

Environment Variables:

```env
S3_BUCKET=
SQS_QUEUE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Resume Processor Lambda

Responsibilities:

* Download Resume from S3
* Extract Resume Text
* Scrub PII
* Parse Resume via Groq
* Store Candidate Data

Environment Variables:

```env
S3_BUCKET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
```

---

# Database Design

## Tables

### candidates

Stores candidate profile information.

### candidate_skills

Stores extracted skills.

### candidate_projects

Stores extracted projects.

### candidate_certifications

Stores extracted certifications.

Schema available in:

```text
database/schema.sql
```

---

# API Endpoints

## Health Check

```http
GET /health
```

---

## Generate Upload URL

```http
POST /upload-url
```

Request:

```json
{
  "file_name": "resume.pdf",
  "content_type": "application/pdf"
}
```

---

## Upload Complete

```http
POST /upload-complete
```

Request:

```json
{
  "candidate_id": "uuid",
  "s3_key": "resumes/uuid/resume.pdf"
}
```

---

## Get Candidates

```http
GET /candidates
```

---

## Candidate Details

```http
GET /candidate/{id}
```

---

## Search Candidates

```http
GET /search
```

Example:

```http
/search?skill=AWS&location=Nagpur&min_experience=1
```

---

# Security Features

* Presigned S3 uploads
* Backend-only database access
* Service Role Key never exposed to frontend
* PII scrubbing before LLM processing
* HTTPS enforced through CloudFront
* Security Headers Policy
* Least Privilege IAM Policies
* Asynchronous processing through SQS

---

# Future Enhancements

* Recruiter Authentication
* Candidate Ranking
* Resume Scoring
* Resume Versioning
* Advanced Search Filters
* Multi-Tenant Recruiter Support
* Analytics Dashboard

---

# Documentation

Additional documentation can be found in:

```text
docs/api-design.md
docs/database-design.md
docs/sqs-design.md
```

---

# Author

**Sanved Latkar**


Cloud & DevOps Enthusiast

Nagpur, India

```

**Project Type:** AI Resume Parsing Platform

**Core Services Used:** AWS Lambda, API Gateway, S3, SQS, CloudFront, Groq LLM, Supabase PostgreSQL
```

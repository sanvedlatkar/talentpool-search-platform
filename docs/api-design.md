# TalentPulse API Design

## Overview

TalentPulse uses AWS API Gateway + Lambda to provide APIs for:

1. Resume Upload
2. Resume Processing Trigger
3. Candidate Search
4. Candidate Details Retrieval

---

# Base URL

https://<api-id>.execute-api.ap-south-1.amazonaws.com/dev

---

# 1. Health Check

## Request

GET /health

## Response

```json
{
  "status": "healthy",
  "service": "TalentPool API"
}
```

---

# 2. Generate Upload URL

Generates a pre-signed S3 upload URL.

## Request

POST /upload-url

```json
{
  "file_name": "resume.pdf",
  "content_type": "application/pdf"
}
```

## Response

```json
{
  "candidate_id": "uuid",
  "upload_url": "presigned-url",
  "s3_key": "resumes/uuid/resume.pdf"
}
```

---

# 3. Upload Resume to S3

Frontend uploads directly to S3 using the returned URL.

## Request

PUT <upload_url>

Body:
Binary Resume File

Supported Types:

- PDF
- DOCX

---

# 4. Upload Complete

Notifies backend that upload is finished.

## Request

POST /upload-complete

```json
{
  "candidate_id": "uuid",
  "s3_key": "resumes/uuid/resume.pdf"
}
```

## Response

```json
{
  "candidate_id": "uuid",
  "resume_url": "s3-url",
  "status": "QUEUED_FOR_PROCESSING",
  "message_id": "sqs-message-id"
}
```

---

# 5. Get All Candidates

Returns summary information.

## Request

GET /candidates

## Response

```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "current_title": "Cloud Engineer",
    "location": "Nagpur",
    "experience_years": 2
  }
]
```

---

# 6. Get Candidate Details

Returns complete profile.

## Request

GET /candidate/{id}

## Response

```json
{
  "candidate": {},
  "skills": [],
  "projects": [],
  "certifications": []
}
```

---

# 7. Search Candidates

Supports multiple filters.

## Request

GET /search

### Query Parameters

| Parameter | Description |
|------------|-------------|
| skill | Skill name |
| location | Candidate location |
| min_experience | Minimum years of experience |

Example:

/search?skill=AWS&location=Nagpur&min_experience=1

## Response

```json
[
  {
    "id": "uuid",
    "name": "John Doe"
  }
]
```

---

# Error Response

```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

---

# Security

- Pre-signed S3 uploads
- Backend-only Supabase access
- Service Role Key never exposed
- API Gateway throttling enabled
- CloudFront HTTPS enforced
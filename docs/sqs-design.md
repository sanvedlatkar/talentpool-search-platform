# TalentPulse SQS Design

## Purpose

Amazon SQS is used to decouple file uploads from resume processing.

This prevents:

- API timeouts
- Long-running uploads
- Slow Groq requests
- Failed user experience

---

# Architecture

Frontend

↓

API Gateway

↓

API Lambda

↓

SQS Queue

↓

Resume Processor Lambda

↓

Groq

↓

Supabase

---

# Queue Details

Queue Name:

```text
tps-dev-resume-processing-queue
```

Type:

```text
Standard Queue
```

---

# Message Format

```json
{
  "candidate_id": "uuid",
  "s3_key": "resumes/uuid/resume.pdf"
}
```

---

# Processing Flow

## Step 1

Candidate uploads resume.

---

## Step 2

API Lambda generates:

```json
{
  "candidate_id": "...",
  "s3_key": "..."
}
```

---

## Step 3

Message pushed to SQS.

```python
sqs.send_message(...)
```

---

## Step 4

SQS triggers Resume Processor Lambda.

---

## Step 5

Resume Processor:

1. Downloads file from S3
2. Extracts text
3. Scrubs PII
4. Sends text to Groq
5. Receives structured JSON
6. Saves data to Supabase

---

# Retry Behaviour

If Lambda fails:

SQS automatically retries.

Benefits:

- No data loss
- Temporary failures recover automatically

---

# Dead Letter Queue (Recommended)

Future Enhancement:

```text
Resume Queue
        │
        ▼
   DLQ Queue
```

Failed messages can be inspected later.

---

# Security

## IAM Permissions

API Lambda

```json
sqs:SendMessage
```

Resume Processor

```json
sqs:ReceiveMessage
sqs:DeleteMessage
```

---

# Advantages of SQS

## Reliability

Messages are persisted.

## Scalability

Multiple Lambda executions can process resumes.

## Decoupling

Upload API remains fast.

## Cost Effective

Pay only for requests.

---

# Production Benefits

Without SQS:

Upload
→ Parse
→ Groq
→ Database

High timeout risk.

With SQS:

Upload
→ Queue

Background processing handles parsing safely.

This architecture follows AWS serverless best practices.
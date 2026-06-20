# API Design

## GET /health

Returns API health status.

## POST /upload-url

Generates a presigned S3 upload URL.

Request:

{
  "file_name": "resume.pdf",
  "content_type": "application/pdf"
}

## POST /upload-complete

Registers uploaded resume.

Request:

{
  "candidate_id": "uuid",
  "s3_key": "resumes/uuid/resume.pdf"
}
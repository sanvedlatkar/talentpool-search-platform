import json
import uuid
import boto3
import os

s3_client = boto3.client("s3")

BUCKET_NAME = os.environ["S3_BUCKET"]


def generate_upload_url(file_name, content_type):
    return s3_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": file_name,
            "ContentType": content_type
        },
        ExpiresIn=300
    )


def lambda_handler(event, context):

    route_key = event.get("routeKey")

    # Health Check Endpoint
    if route_key == "GET /health":

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "healthy",
                "service": "TalentPool API"
            })
        }

    # Generate Presigned Upload URL
    if route_key == "POST /upload-url":

        body = json.loads(event.get("body", "{}"))

        file_name = body["file_name"]
        content_type = body["content_type"]

        candidate_id = str(uuid.uuid4())

        s3_key = f"resumes/{candidate_id}/{file_name}"

        upload_url = generate_upload_url(
            s3_key,
            content_type
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "candidate_id": candidate_id,
                "upload_url": upload_url,
                "s3_key": s3_key
            })
        }

    return {
        "statusCode": 404,
        "body": json.dumps({
            "message": "Route not found"
        })
    }
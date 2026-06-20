import boto3
import os

s3_client = boto3.client("s3")

BUCKET_NAME = os.environ.get("S3_BUCKET")


def generate_upload_url(file_name, content_type):

    return s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": file_name,
            "ContentType": content_type
        },
        ExpiresIn=300
    )
import json
import boto3
import os

s3 = boto3.client("s3")

BUCKET_NAME = os.environ["S3_BUCKET"]


def lambda_handler(event, context):

    for record in event["Records"]:

        message = json.loads(
            record["body"]
        )

        s3_key = message["s3_key"]

        file_name = s3_key.split("/")[-1]

        local_path = f"/tmp/{file_name}"

        s3.download_file(
            BUCKET_NAME,
            s3_key,
            local_path
        )

        print(
            f"Downloaded: {local_path}"
        )

    return {
        "statusCode": 200
    }
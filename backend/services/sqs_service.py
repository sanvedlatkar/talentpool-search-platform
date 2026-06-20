import boto3
import json
import os

sqs = boto3.client("sqs")

QUEUE_URL = os.environ["QUEUE_URL"]


def send_resume_message(
    candidate_id,
    s3_key
):

    message = {
        "candidate_id": candidate_id,
        "s3_key": s3_key
    }

    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message)
    )
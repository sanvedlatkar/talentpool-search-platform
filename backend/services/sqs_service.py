import boto3
import json
import os

sqs = boto3.client("sqs")

QUEUE_URL = os.environ.get("QUEUE_URL")


def send_resume_message(payload):

    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(payload)
    )
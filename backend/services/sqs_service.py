import boto3
from config import SQS_QUEUE_URL

sqs = boto3.client("sqs")
send_resume_for_processing()
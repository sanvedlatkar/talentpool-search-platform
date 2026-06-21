import json
import boto3
import os
import pdfplumber
from docx import Document

s3 = boto3.client("s3")

BUCKET_NAME = os.environ["S3_BUCKET"]


def extract_pdf_text(file_path):

    text = ""

    with pdfplumber.open(file_path) as pdf:

        for page in pdf.pages:

            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

    return text


def extract_docx_text(file_path):

    document = Document(file_path)

    return "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
    )


def extract_text(file_path):

    if file_path.lower().endswith(".pdf"):
        return extract_pdf_text(file_path)

    if file_path.lower().endswith(".docx"):
        return extract_docx_text(file_path)

    raise ValueError(
        "Unsupported file type"
    )


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

        text = extract_text(
            local_path
        )

        print(
            f"Characters Extracted: {len(text)}"
        )

        print(
            text[:500]
        )

    return {
        "statusCode": 200
    }
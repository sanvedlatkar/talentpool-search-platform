from supabase import create_client
import os

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_ANON_KEY"]
)


def create_candidate_record(
    candidate_id,
    resume_url,
    s3_key
):

    payload = {
        "id": candidate_id,
        "resume_url": resume_url,
        "processing_status": "UPLOADED"
    }

    response = (
        supabase
        .table("candidates")
        .insert(payload)
        .execute()
    )

    return response
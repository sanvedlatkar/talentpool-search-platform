from supabase import create_client
import os

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_ANON_KEY"]
)


def create_candidate(
    candidate_id,
    resume_url
):

    payload = {
        "id": candidate_id,
        "resume_url": resume_url,
        "processing_status": "UPLOADED"
    }

    return (
        supabase
        .table("candidates")
        .insert(payload)
        .execute()
    )


def create_processing_history(
    candidate_id,
    status,
    message
):

    payload = {
        "candidate_id": candidate_id,
        "status": status,
        "message": message
    }

    return (
        supabase
        .table("processing_history")
        .insert(payload)
        .execute()
    )
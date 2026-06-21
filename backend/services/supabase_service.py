from supabase import create_client
import os

# Initialize Supabase client using the Service Role Key for backend access
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)

def save_candidate(candidate_id, parsed_resume, contact_details):
    data = {
        "id": candidate_id,
        "name": parsed_resume.get("full_name"),
        "email": contact_details.get("email"),
        "phone": contact_details.get("phone"),
        "linkedin_url": contact_details.get("linkedin_url"),
        "github_url": contact_details.get("github_url"),
        "current_title": parsed_resume.get("current_title"),
        "experience_years": parsed_resume.get("experience_years"),
        "raw_json": parsed_resume
    }

    return (
        supabase
        .table("candidates")
        .insert(data)
        .execute()
    )


def save_skills(candidate_id, skills):
    rows = []

    for skill in skills:
        rows.append({
            "candidate_id": candidate_id,
            "skill": skill
        })

    if rows:
        supabase.table(
            "candidate_skills"
        ).insert(rows).execute()


def save_certifications(candidate_id, certifications):
    rows = []

    for cert in certifications:
        rows.append({
            "candidate_id": candidate_id,
            "certification_name": cert.get("name"),
            "provider": cert.get("provider"),
            "status": cert.get("status")
        })

    if rows:
        supabase.table(
            "candidate_certifications"
        ).insert(rows).execute()


def save_projects(candidate_id, projects):
    rows = []

    for project in projects:
        rows.append({
            "candidate_id": candidate_id,
            "project_name": project.get("name"),
            "technologies": project.get("technologies", [])
        })

    if rows:
        supabase.table(
            "candidate_projects"
        ).insert(rows).execute()
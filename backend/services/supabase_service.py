from supabase import create_client
import os

# Initialize Supabase client using the Service Role Key for backend access
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)

# ==========================================
# WRITE FUNCTIONS (Resume Processing Pipeline)
# ==========================================
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


# ==========================================
# READ FUNCTIONS (Recruiter Frontend APIs)
# ==========================================
def get_candidates():
    response = (
        supabase
        .table("candidates")
        .select("id, name, current_title")
        .execute()
    )
    
    return response.data


def get_candidate(candidate_id):
    candidate = (
        supabase
        .table("candidates")
        .select("*")
        .eq("id", candidate_id)
        .execute()
    )

    skills = (
        supabase
        .table("candidate_skills")
        .select("*")
        .eq("candidate_id", candidate_id)
        .execute()
    )

    projects = (
        supabase
        .table("candidate_projects")
        .select("*")
        .eq("candidate_id", candidate_id)
        .execute()
    )

    certifications = (
        supabase
        .table("candidate_certifications")
        .select("*")
        .eq("candidate_id", candidate_id)
        .execute()
    )

    return {
        "candidate": candidate.data,
        "skills": skills.data,
        "projects": projects.data,
        "certifications": certifications.data
    }


def search_by_skill(skill):
    # .ilike() performs a case-insensitive match (e.g., "AWS" matches "aws")
    skill_rows = (
        supabase
        .table("candidate_skills")
        .select("candidate_id")
        .ilike("skill", f"%{skill}%")
        .execute()
    )

    # Extract just the IDs from the response
    ids = [
        row["candidate_id"]
        for row in skill_rows.data
    ]

    # If no candidates have this skill, exit early
    if not ids:
        return []

    # Fetch the actual candidate profiles using the matched IDs
    candidates = (
        supabase
        .table("candidates")
        .select("*")
        .in_("id", ids)
        .execute()
    )

    return candidates.data
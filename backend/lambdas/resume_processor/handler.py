import json
import boto3
import os
import re

from groq import Groq
from supabase import create_client
from pypdf import PdfReader
from docx import Document

# ==========================================
# CLIENT INITIALIZATION
# ==========================================
s3 = boto3.client("s3")
BUCKET_NAME = os.environ["S3_BUCKET"]

# Initialize Supabase using the Service Role Key to bypass RLS
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)


# ==========================================
# SUPABASE DATABASE FUNCTIONS
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

    # Using upsert to prevent database crashes if SQS retries a message
    return supabase.table("candidates").upsert(data).execute()


def save_skills(candidate_id, skills):
    rows = []
    for skill in skills:
        rows.append({
            "candidate_id": candidate_id,
            "skill": skill
        })

    if rows:
        supabase.table("candidate_skills").insert(rows).execute()


def save_certifications(candidate_id, certifications):
    rows = []
    for cert in certifications:
        # If Groq returns a proper dictionary (Expected behavior)
        if isinstance(cert, dict):
            rows.append({
                "candidate_id": candidate_id,
                "certification_name": cert.get("name"),
                "provider": cert.get("provider"),
                "status": cert.get("status")
            })
        # If Groq hallucinates and returns a flat string (Fallback behavior)
        elif isinstance(cert, str):
            rows.append({
                "candidate_id": candidate_id,
                "certification_name": cert,
                "provider": None,
                "status": None
            })

    if rows:
        supabase.table("candidate_certifications").insert(rows).execute()


def save_projects(candidate_id, projects):
    rows = []
    for project in projects:
        rows.append({
            "candidate_id": candidate_id,
            "project_name": project.get("name"),
            "description": project.get("description"),
            "duration": project.get("duration"),
            "technologies": project.get("technologies", [])
        })

    if rows:
        supabase.table("candidate_projects").insert(rows).execute()


# ==========================================
# GROQ PARSING FUNCTION
# ==========================================
def parse_resume(resume_text):
    client = Groq(
        api_key=os.environ["GROQ_API_KEY"]
    )

    prompt = f"""
Extract resume information.

Return ONLY valid JSON.

{{
  "full_name": "",
  "email": "",
  "phone": "",
  "skills": [],
  "experience_years": 0,
  "education": [],
  "certifications": [
    {{
      "name": "",
      "provider": "",
      "status": ""
    }}
  ],
  "projects": [
    {{
      "name": "",
      "description": "",
      "duration": "",
      "technologies": []
    }}
  ],
  "current_title": ""
}}

Resume:

{resume_text}
"""

    print("Calling Groq API...")
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )
    print("Groq API responded")

    content = response.choices[0].message.content

    print("RAW GROQ RESPONSE:")
    print(content)

    match = re.search(
        r"\{.*\}",
        content,
        re.DOTALL
    )

    if not match:
        raise ValueError("Groq did not return valid JSON")

    return json.loads(match.group(0))


# ==========================================
# TEXT EXTRACTION & SCRUBBING
# ==========================================
def normalize_text(text):
    text = text.replace("\u00a0", " ")
    text = re.sub(r'\s*\.\s*(com|net|org|edu|gov|in|co\.in|uk|us|io)\b', r'.\1', text, flags=re.IGNORECASE)
    text = re.sub(r'(?<=[a-zA-Z0-9])\s*@\s*(?=[a-zA-Z0-9])', '@', text)
    text = re.sub(r'(?<=\b\w)\s(?=\w\b)', '', text)
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    text = re.sub(r'([A-Z]{2,})([A-Z][a-z])', r'\1 \2', text)
    text = text.replace(" ,", ",")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_embedded_links(pdf_path):
    reader = PdfReader(pdf_path)
    links = []

    for page in reader.pages:
        annotations = page.get("/Annots")
        if not annotations:
            continue

        for annotation in annotations:
            try:
                obj = annotation.get_object()
                action = obj.get("/A")
                if not action:
                    continue
                uri = action.get("/URI")
                if not uri:
                    continue

                uri = str(uri)
                lower = uri.lower()

                if (
                    "linkedin.com" in lower
                    or "github.com" in lower
                    or lower.startswith("mailto:")
                ):
                    links.append(uri)
            except Exception as e:
                print(f"Annotation error: {str(e)}")

    return links


def extract_contacts_from_links(links):
    result = {
        "email": None,
        "linkedin_url": None,
        "github_url": None
    }
    for link in links:
        lower = link.lower()
        if lower.startswith("mailto:"):
            result["email"] = link.replace("mailto:", "")
        elif "linkedin.com" in lower:
            result["linkedin_url"] = link
        elif "github.com" in lower:
            result["github_url"] = link
    return result


def extract_contact_details(text, pdf_links=None):
    normalized = normalize_text(text)
    
    email_match = re.search(
        r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|net|org|edu|gov|in|co\.in|uk|us|io))',
        normalized,
        re.IGNORECASE
    )

    regex_email = None
    if email_match:
        raw_email = email_match.group(1)
        regex_email = re.sub(r'^([A-Z]{2,}|\d{6,})+', '', raw_email)

    phone_matches = re.findall(
        r'(?<!\d)(\d{10})(?!\d)',
        normalized
    )

    phone = None
    for candidate in phone_matches:
        if candidate.startswith("20"):
            continue
        phone = candidate
        break

    link_contacts = {
        "email": None,
        "linkedin_url": None,
        "github_url": None
    }

    if pdf_links:
        link_contacts = extract_contacts_from_links(pdf_links)

    return {
        "email": link_contacts["email"] or regex_email,
        "phone": phone,
        "linkedin_url": link_contacts["linkedin_url"],
        "github_url": link_contacts["github_url"]
    }


def scrub_pii(text, contact_details):
    scrubbed = text
    scrubbed = re.sub(
        r'[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*(?:com|net|org|edu|gov|in|co\.in|uk|us|io)',
        '[EMAIL]', scrubbed, flags=re.IGNORECASE
    )
    scrubbed = re.sub(r'(?<!\d)\d{10}(?!\d)', '[PHONE]', scrubbed)
    scrubbed = re.sub(r'https?://(?:www\.)?linkedin\.com/[^\s]+', '[LINKEDIN]', scrubbed, flags=re.IGNORECASE)
    scrubbed = re.sub(r'https?://(?:www\.)?github\.com/[^\s]+', '[GITHUB]', scrubbed, flags=re.IGNORECASE)
    scrubbed = re.sub(r'\s+', ' ', scrubbed)
    return scrubbed.strip()


def extract_pdf_text(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def extract_docx_text(file_path):
    document = Document(file_path)
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def extract_text(file_path):
    if file_path.lower().endswith(".pdf"):
        return extract_pdf_text(file_path)
    if file_path.lower().endswith(".docx"):
        return extract_docx_text(file_path)
    raise ValueError(f"Unsupported file type: {file_path}")


# ==========================================
# MAIN HANDLER (SQS Processor)
# ==========================================
def lambda_handler(event, context):
    print("Incoming SQS Event:")
    print(json.dumps(event))

    try:
        for record in event["Records"]:
            message = json.loads(record["body"])
            candidate_id = message["candidate_id"]
            
            print(json.dumps({"candidate_id": candidate_id, "status": "processing"}))
            
            s3_key = message["s3_key"]
            file_name = s3_key.split("/")[-1]
            local_path = f"/tmp/{file_name}"

            print(f"Downloading file: {s3_key}")
            s3.download_file(BUCKET_NAME, s3_key, local_path)

            pdf_links = []
            if local_path.lower().endswith(".pdf"):
                pdf_links = extract_embedded_links(local_path)

            print(f"Relevant PDF links detected: {len(pdf_links)}")
            print(f"Downloaded to: {local_path}")

            # 1. Extract & Normalize Text
            extracted_text = extract_text(local_path)
            normalized_text = normalize_text(extracted_text)

            # 2. Extract Contacts & Scrub PII
            contact_details = extract_contact_details(normalized_text, pdf_links)
            scrubbed_text = scrub_pii(normalized_text, contact_details)

            print("CONTACT EXTRACTION STATUS")
            print(json.dumps({
                "email_found": bool(contact_details["email"]),
                "phone_found": bool(contact_details["phone"]),
                "linkedin_found": bool(contact_details["linkedin_url"]),
                "github_found": bool(contact_details["github_url"])
            }, indent=2))

            # 3. Parse via Groq
            print("Sending scrubbed text to Groq for parsing...")
            parsed_candidate_data = parse_resume(scrubbed_text)
            
            print("GROQ PARSING RESULT:")
            print(json.dumps(parsed_candidate_data, indent=2))

            # 4. Store in Supabase
            print("Storing candidate data in Supabase...")
            
            # Pass contact_details to inject real un-scrubbed info into the database
            save_candidate(candidate_id, parsed_candidate_data, contact_details)
            print("Core candidate record saved.")

            if parsed_candidate_data.get("skills"):
                save_skills(candidate_id, parsed_candidate_data["skills"])
                print(f"Saved {len(parsed_candidate_data['skills'])} skills.")

            if parsed_candidate_data.get("certifications"):
                save_certifications(candidate_id, parsed_candidate_data["certifications"])
                print(f"Saved {len(parsed_candidate_data['certifications'])} certifications.")

            if parsed_candidate_data.get("projects"):
                save_projects(candidate_id, parsed_candidate_data["projects"])
                print(f"Saved {len(parsed_candidate_data['projects'])} projects.")

            print(json.dumps({"candidate_id": candidate_id, "status": "completed"}))

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Resume processed successfully"})
        }

    except Exception as e:
        print(json.dumps({"status": "failed", "error": str(e)}))
        raise
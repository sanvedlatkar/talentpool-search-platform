import json
import boto3
import os
import re

from groq import Groq
from pypdf import PdfReader
from docx import Document

s3 = boto3.client("s3")

BUCKET_NAME = os.environ["S3_BUCKET"]


# ==========================================
# GROQ PARSING FUNCTION (Integrated)
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
  "certifications": [],
  "projects": [],
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
        raise ValueError(
            "Groq did not return valid JSON"
        )

    return json.loads(
        match.group(0)
    )


# ==========================================
# TEXT EXTRACTION & SCRUBBING
# ==========================================
def normalize_text(text):
    # 1. Replace non-breaking spaces
    text = text.replace("\u00a0", " ")

    # 2. Safely fix common email domain spacing before squashing
    text = re.sub(r'\s*\.\s*(com|net|org|edu|gov|in|co\.in|uk|us|io)\b', r'.\1', text, flags=re.IGNORECASE)

    # 3. Safely fix spaces around the @ symbol for emails
    text = re.sub(r'(?<=[a-zA-Z0-9])\s*@\s*(?=[a-zA-Z0-9])', '@', text)

    # 4. RESTORED BUG FIX: Squash single-spaced letters to fix heavily kerned text 
    # (e.g., 'S A N V E D' -> 'SANVED', '9 8 7' -> '987'). 
    # This is absolutely required for the email/phone regex to match.
    text = re.sub(r'(?<=\b\w)\s(?=\w\b)', '', text)

    # 5. Fix the CamelCase squashing that happens as a side-effect of step 4 
    # (e.g., "studentMotivated" -> "student Motivated")
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    
    # (e.g., "ENGINEERMotivated" -> "ENGINEER Motivated")
    text = re.sub(r'([A-Z]{2,})([A-Z][a-z])', r'\1 \2', text)

    # 6. Fix weird punctuation spacing from extraction
    text = text.replace(" ,", ",")

    # 7. Restore normal word spacing
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

    # Email regex: explicitly stops at common TLDs to prevent eating trailing words
    email_match = re.search(
        r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|net|org|edu|gov|in|co\.in|uk|us|io))',
        normalized,
        re.IGNORECASE
    )

    regex_email = None
    if email_match:
        raw_email = email_match.group(1)
        # Strip out any ALLCAPS headings or phone numbers stuck to the front of the email
        regex_email = re.sub(r'^([A-Z]{2,}|\d{6,})+', '', raw_email)

    # Phone regex
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

    # Link extraction
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
        '[EMAIL]',
        scrubbed,
        flags=re.IGNORECASE
    )

    scrubbed = re.sub(
        r'(?<!\d)\d{10}(?!\d)',
        '[PHONE]',
        scrubbed
    )

    scrubbed = re.sub(
        r'https?://(?:www\.)?linkedin\.com/[^\s]+',
        '[LINKEDIN]',
        scrubbed,
        flags=re.IGNORECASE
    )

    scrubbed = re.sub(
        r'https?://(?:www\.)?github\.com/[^\s]+',
        '[GITHUB]',
        scrubbed,
        flags=re.IGNORECASE
    )

    scrubbed = re.sub(
        r'\s+',
        ' ',
        scrubbed
    )

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
    return "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
    )


def extract_text(file_path):
    if file_path.lower().endswith(".pdf"):
        return extract_pdf_text(file_path)

    if file_path.lower().endswith(".docx"):
        return extract_docx_text(file_path)

    raise ValueError(f"Unsupported file type: {file_path}")


# ==========================================
# MAIN HANDLER
# ==========================================
def lambda_handler(event, context):
    print("Incoming Event:")
    print(json.dumps(event))

    try:
        for record in event["Records"]:
            message = json.loads(record["body"])
            candidate_id = message["candidate_id"]
            
            print(
                json.dumps(
                    {
                        "candidate_id": candidate_id,
                        "status": "processing"
                    }
                )
            )
            
            s3_key = message["s3_key"]
            file_name = s3_key.split("/")[-1]
            local_path = f"/tmp/{file_name}"

            print(f"Downloading file: {s3_key}")
            s3.download_file(BUCKET_NAME, s3_key, local_path)

            # Safely attempt to extract PDF links if it's a PDF
            pdf_links = []
            if local_path.lower().endswith(".pdf"):
                pdf_links = extract_embedded_links(local_path)

            print(f"Relevant PDF links detected: {len(pdf_links)}")

            print(f"Downloaded to: {local_path}")

            # 1. Extract raw text
            extracted_text = extract_text(local_path)

            # 2. Normalize text
            normalized_text = normalize_text(extracted_text)

            # 3. Extract contact details (combining regex and embedded links)
            contact_details = extract_contact_details(normalized_text, pdf_links)

            # 4. Scrub the text using the extracted details
            scrubbed_text = scrub_pii(normalized_text, contact_details)

            # 5. Output Verification Logs
            print("CONTACT EXTRACTION STATUS")
            print(
                json.dumps(
                    {
                        "email_found": bool(contact_details["email"]),
                        "phone_found": bool(contact_details["phone"]),
                        "linkedin_found": bool(contact_details["linkedin_url"]),
                        "github_found": bool(contact_details["github_url"])
                    },
                    indent=2
                )
            )

            print(f"Original Length: {len(normalized_text)}")
            print(f"Scrubbed text generated successfully. Length={len(scrubbed_text)}")

            # 6. Parse structured candidate JSON via Groq
            print("Sending scrubbed text to Groq for parsing...")
            parsed_candidate_data = parse_resume(scrubbed_text)

            print("GROQ PARSING RESULT:")
            print(json.dumps(parsed_candidate_data, indent=2))

            # TODO:
            # Store candidate data in Supabase

            print(
                json.dumps(
                    {
                        "candidate_id": candidate_id,
                        "status": "completed"
                    }
                )
            )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Resume processed successfully"})
        }

    except Exception as e:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "error": str(e)
                }
            )
        )
        raise
import json
import os

from groq import Groq


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

    content = (
        content
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    return json.loads(content)
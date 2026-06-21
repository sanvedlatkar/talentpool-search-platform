from dotenv import load_dotenv

load_dotenv()

from backend.services.groq_service import parse_resume

sample_resume = """
SANVED LATKAR

Cloud / DevOps Engineer

Skills:
AWS
Python
Docker
Terraform
Linux
"""

result = parse_resume(sample_resume)

print("\nPARSED RESULT")
print("=" * 50)
print(result)
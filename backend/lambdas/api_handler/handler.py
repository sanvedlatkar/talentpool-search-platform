import json

import uuid

import boto3

import os



from supabase import create_client



# ==========================================

# CLIENT INITIALIZATION

# ==========================================

s3_client = boto3.client("s3")

sqs_client = boto3.client("sqs")



BUCKET_NAME = os.environ["S3_BUCKET"]

QUEUE_URL = os.environ["SQS_QUEUE_URL"]



# Initialize Supabase

supabase = create_client(

    os.environ["SUPABASE_URL"],

    os.environ["SUPABASE_SERVICE_ROLE_KEY"]

)



# Standard CORS headers required for the React Frontend

CORS_HEADERS = {

    "Content-Type": "application/json",

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",

    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"

}





# ==========================================

# SUPABASE DATABASE FUNCTIONS (READ ONLY)

# ==========================================

def get_candidates():

    response = (

        supabase

        .table("candidates")

        .select("id, name, current_title, location, experience_years")

        .execute()

    )

    return response.data





def get_candidate(candidate_id):

    candidate = supabase.table("candidates").select("*").eq("id", candidate_id).execute()

    skills = supabase.table("candidate_skills").select("*").eq("candidate_id", candidate_id).execute()

    projects = supabase.table("candidate_projects").select("*").eq("candidate_id", candidate_id).execute()

    certifications = supabase.table("candidate_certifications").select("*").eq("candidate_id", candidate_id).execute()



    return {

        "candidate": candidate.data[0] if candidate.data else None,

        "skills": skills.data,

        "projects": projects.data,

        "certifications": certifications.data

    }





def search_candidates(skill, min_exp, location):

    # Start the base query on the candidates table

    query = supabase.table("candidates").select("*")



    # Filter 1: Minimum Years of Experience

    if min_exp:

        # .gte means "Greater Than or Equal to"

        query = query.gte("experience_years", int(min_exp))



    # Filter 2: Location

    if location:

        query = query.ilike("location", f"%{location}%")



    # Filter 3: Skill (Requires checking the related skills table)

    if skill:

        skill_rows = (

            supabase

            .table("candidate_skills")

            .select("candidate_id")

            .ilike("skill", f"%{skill}%")

            .execute()

        )

       

        ids = [row["candidate_id"] for row in skill_rows.data]

       

        if not ids:

            return [] # Skill not found, return empty array immediately

           

        # Add the ID filter to our main query

        query = query.in_("id", ids)



    # Execute the combined filters

    response = query.execute()

    return response.data





# ==========================================

# HELPER FUNCTIONS

# ==========================================

def generate_upload_url(file_name, content_type):

    return s3_client.generate_presigned_url(

        ClientMethod="put_object",

        Params={

            "Bucket": BUCKET_NAME,

            "Key": file_name,

            "ContentType": content_type

        },

        ExpiresIn=300

    )





# ==========================================

# MAIN API HANDLER

# ==========================================

def lambda_handler(event, context):

    print("Incoming Event:")

    print(json.dumps(event))



    route_key = event.get("routeKey")



    try:

        # ==========================================

        # HEALTH CHECK

        # ==========================================

        if route_key == "GET /health":

            return {

                "statusCode": 200,

                "headers": CORS_HEADERS,

                "body": json.dumps({

                    "status": "healthy",

                    "service": "TalentPool API"

                })

            }



        # ==========================================

        # GENERATE PRESIGNED URL

        # ==========================================

        if route_key == "POST /upload-url":

            body = json.loads(event.get("body", "{}"))

            file_name = body["file_name"]

            content_type = body["content_type"]

            candidate_id = str(uuid.uuid4())

            s3_key = f"resumes/{candidate_id}/{file_name}"



            upload_url = generate_upload_url(s3_key, content_type)

            print(f"Created Upload URL for {candidate_id}")



            return {

                "statusCode": 200,

                "headers": CORS_HEADERS,

                "body": json.dumps({

                    "candidate_id": candidate_id,

                    "upload_url": upload_url,

                    "s3_key": s3_key

                })

            }



        # ==========================================

        # UPLOAD COMPLETE

        # ==========================================

        if route_key == "POST /upload-complete":

            body = json.loads(event.get("body", "{}"))

            candidate_id = body["candidate_id"]

            s3_key = body["s3_key"]



            print("Sending message to SQS")

            response = sqs_client.send_message(

                QueueUrl=QUEUE_URL,

                MessageBody=json.dumps({

                    "candidate_id": candidate_id,

                    "s3_key": s3_key

                })

            )



            print("SQS Message Sent")

            print(response["MessageId"])



            resume_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"



            return {

                "statusCode": 200,

                "headers": CORS_HEADERS,

                "body": json.dumps({

                    "candidate_id": candidate_id,

                    "resume_url": resume_url,

                    "status": "QUEUED_FOR_PROCESSING",

                    "message_id": response["MessageId"]

                })

            }



        # ==========================================

        # RECRUITER APIs

        # ==========================================

        if route_key == "GET /candidates":

            return {

                "statusCode": 200,

                "headers": CORS_HEADERS,

                "body": json.dumps(get_candidates())

            }



        if route_key == "GET /candidate/{id}":

            candidate_id = event["pathParameters"]["id"]

            return {

                "statusCode": 200,

                "headers": CORS_HEADERS,

                "body": json.dumps(get_candidate(candidate_id))

            }



        if route_key == "GET /search":

            query_params = event.get("queryStringParameters") or {}

           

            # Extract the three possible filters

            skill = query_params.get("skill", "")

            min_exp = query_params.get("min_experience", "")

            location = query_params.get("location", "")



            return {

                "statusCode": 200,

                "headers": CORS_HEADERS,

                "body": json.dumps(search_candidates(skill, min_exp, location))

            }



        # Fallback for undefined routes

        return {

            "statusCode": 404,

            "headers": CORS_HEADERS,

            "body": json.dumps({"message": "Route not found"})

        }



    except Exception as e:

        print(f"API Error: {str(e)}")

        return {

            "statusCode": 500,

            "headers": CORS_HEADERS,

            "body": json.dumps({

                "error": "Internal server error",

                "details": str(e)

            })

        } 


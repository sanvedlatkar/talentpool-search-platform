import json

def lambda_handler(event, context):

    route_key = event.get("routeKey")

    if route_key == "GET /health":
        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "healthy",
                "service": "TalentPool API"
            })
        }

    if route_key == "POST /upload-url":
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "upload endpoint placeholder"
            })
        }

    return {
        "statusCode": 404,
        "body": json.dumps({
            "message": "not found"
        })
    }
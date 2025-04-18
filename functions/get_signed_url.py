import os
from datetime import datetime, timedelta, timezone

import google.auth  # Used to find ADC
import google.auth.transport.requests
from google.cloud import storage
from werkzeug import Request


def get_signed_url(request: Request):
    request_json = request.get_json(silent=True)
    if not request_json:
        return "Please provide a request body", 400
    run_id = request_json.get("run_id")
    dashboard_id = request_json.get("dashboard_id")

    if not run_id:
        return "Please provide run_id in the request body", 400

    credentials, project_id = google.auth.default()
    if credentials.token is None:
        # Create a transport object for refreshing credentials
        transport = google.auth.transport.requests.Request()
        credentials.refresh(transport)

    try:
        # Instantiate the client, authenticating with ADC
        storage_client = storage.Client()
        bucket = storage_client.bucket(os.environ.get("GCP_BUCKET_NAME"))

        # Get the folder name from the run_id since they are the same
        folder_name = run_id
        # Construct the combined PDF blob name using the same pattern as in combine_render_tasks.py
        combined_blob_name = f"{folder_name}/{folder_name}-combined.pdf"

        if dashboard_id:
            combined_blob_name = (
                f"{folder_name}/pdf-combiner-dashboard-{dashboard_id}.pdf"
            )
        blob = bucket.blob(combined_blob_name)

        # Create signing information
        expiration = datetime.now(timezone.utc) + timedelta(hours=1)

        try:
            signed_url = blob.generate_signed_url(
                version="v4",
                service_account_email=credentials.service_account_email,
                access_token=credentials.token,
                expiration=expiration,
            )
        except Exception as e:
            print(f"Error generating signed URL: {e}")
            # Add specific checks for common errors like missing permissions
            if "iam.serviceAccounts.signBlob" in str(e):
                print(
                    "Hint: Ensure the service account has the 'iam.serviceAccounts.signBlob' permission."
                )
            return None

        return {"status": "success", "signed_url": signed_url, "expires_in": "1 hour"}

    except Exception as e:
        return f"Error generating signed URL: {str(e)}", 500

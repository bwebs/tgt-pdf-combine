import os

import yaml
from google.cloud import storage
from werkzeug import Request

from functions.utils import get_sdk


def get_and_combine_dashboard_lookml(request: Request) -> dict:
    """Get LookML for multiple dashboards and combine them into a single YAML file.

    Args:
        request: The request object containing a list of dashboard_ids in the JSON body

    Returns:
        A dictionary containing the status and the combined YAML's blob name or an error message
    """
    sdk = get_sdk(
        access_token=request.environ.get("access_token"),
        looker_sdk_base_url=request.environ.get("looker_sdk_base_url"),
    )
    request_json = request.get_json(silent=True)
    if not request_json or "dashboard_ids" not in request_json:
        return "Please provide a list of dashboard_ids in the request body", 400

    storage_client = storage.Client()
    folder_name = request_json.get("folder_name")

    if not folder_name:
        return "Please provide a folder_name in the request body", 400

    bucket_name = os.environ.get("GCP_BUCKET_NAME")
    if not bucket_name:
        return "GCP_BUCKET_NAME environment variable is not set", 400

    try:
        # Initialize with the hardcoded header
        combined_lookml = {
            "dashboard": "sample_1_ecommerce_business_pulse__basic",
            "title": "PDF Combiner Lookml Test",
            "layout": "newspaper",
            "preferred_viewer": "dashboards-next",
            "description": "",
            "elements": [],
            "filters": [],
        }

        for dashboard_id in request_json.get("dashboard_ids", []):
            # Get the LookML for each dashboard
            lookml = sdk.dashboard_lookml(dashboard_id)

            # Convert the LookML string to a dictionary
            dashboard_lookml = yaml.safe_load(lookml.lookml)

            # Process elements
            if "elements" in dashboard_lookml:
                for element in dashboard_lookml["elements"]:
                    # Remove the row property if it exists
                    if "row" in element:
                        del element["row"]
                    combined_lookml["elements"].append(element)

            # Process filters
            if "filters" in dashboard_lookml:
                combined_lookml["filters"].extend(dashboard_lookml["filters"])

        # Convert the combined dictionary back to YAML
        combined_yaml = yaml.dump(combined_lookml, sort_keys=False)

        # Save the combined YAML to a file
        output_filename = "combined_dashboard_lookml.yaml"
        bucket = storage_client.bucket(bucket_name)
        # Construct blob path with folder
        blob_path = f"{folder_name}/{output_filename}"
        blob = bucket.blob(blob_path)
        blob.upload_from_string(combined_yaml)

        return {
            "status": "success",
            "combined_lookml_file": output_filename,
            "number_of_dashboards_processed": len(
                request_json.get("dashboard_ids", [])
            ),
        }

    except Exception as e:
        return f"Error processing dashboard LookML: {str(e)}", 500

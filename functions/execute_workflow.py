import json
import os

from google.cloud import workflows_v1
from google.cloud.workflows import executions_v1
from google.cloud.workflows.executions_v1 import Execution
from werkzeug import Request


def execute_workflow(request: Request) -> Execution:
    """
    Execute a Google Cloud Workflow with the given folder_id.

    Args:
        folder_id (str): The ID of the folder to process

    Returns:
        Execution: The workflow execution object
    """
    # Initialize the Workflows client
    client = workflows_v1.WorkflowsClient()

    request_json = request.get_json(silent=True)
    folder_id = request_json.get("folder_id")
    if not folder_id:
        return "folder_id is required", 400

    os.environ["GOOGLE_CLOUD_PROJECT_ID"] = "kwhitlow-bi-prod"

    # Get the project ID from environment variables
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    if not project_id:
        return "GOOGLE_CLOUD_PROJECT environment variable is not set", 500

    # Get the location from environment variables or use default
    location = os.getenv("WORKFLOW_LOCATION", "us-central1")

    # Get the workflow name from environment variables
    workflow_name = os.getenv("WORKFLOW_NAME", "pdf-combiner")
    if not workflow_name:
        return "WORKFLOW_NAME environment variable is not set", 500

    # Construct the full workflow name
    workflow_path = client.workflow_path(project_id, location, workflow_name)

    # Initialize the Executions client
    executions_client = executions_v1.ExecutionsClient()
    args = dict(
        folder_id=folder_id,
    )
    if request.environ.get("access_token"):
        args["access_token"] = request.environ.get("access_token")
    if request.environ.get("looker_sdk_base_url"):
        args["looker_sdk_base_url"] = request.environ.get("looker_sdk_base_url")

    try:
        # Create the execution with the folder_id as an argument
        execution = executions_client.create_execution(
            request={
                "parent": workflow_path,
                "execution": {"argument": json.dumps(args)},
            }
        )
    except Exception as e:
        print(e)
        return "Error creating execution", 500

    return dict(success=True)

import os

from google.cloud import storage
from werkzeug import Request


def list_files_in_folder(request: Request) -> dict:
    """List files in a Google Cloud Storage bucket and folder.

    Args:
        request: The request object containing the folder_name in the JSON body

    Returns:
        A dictionary containing the list of files, count of files, and folder_name or an error message
    """
    request_json = request.get_json(silent=True)
    if not request_json or "folder_name" not in request_json:
        return "Please provide a folder_name in the request body", 400

    try:
        # Initialize the storage client
        storage_client = storage.Client()

        # Get the bucket from environment variable
        bucket = storage_client.bucket(os.environ.get("GCP_BUCKET_NAME"))

        # List all blobs in the specified folder
        blobs = bucket.list_blobs(prefix=request_json["folder_name"])

        # Extract file names
        files = [blob.name for blob in blobs]
        print(files)
        return {
            "folder_name": request_json["folder_name"],
            "files": files,
            "file_count": len(files),
        }
    except Exception as e:
        return f"Error listing files: {str(e)}", 500

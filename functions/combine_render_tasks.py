import io
import os

from google.cloud import storage
from looker_sdk import init40
from PyPDF2 import PdfMerger
from werkzeug import Request

sdk = init40()


def get_and_combine_render_tasks(request: Request) -> dict:
    """Get the results of multiple render tasks and combine them into a single PDF.

    Args:
        request: The request object containing render_task_ids and folder_name in the JSON body

    Returns:
        A dictionary containing the status and the combined PDF's blob name or an error message
    """

    request_json = request.get_json(silent=True)
    if not request_json or "render_task_ids" not in request_json:
        return "Please provide render_task_ids in the request body", 400

    folder_name = request_json["folder_name"]
    if not folder_name:
        return "Please provide folder_name in the request body", 400

    try:
        # Initialize the storage client
        storage_client = storage.Client()
        bucket = storage_client.bucket(os.environ.get("GCP_BUCKET_NAME"))

        # Create a PDF merger
        merger = PdfMerger()
        individual_pdfs = []

        for task_id in request_json["render_task_ids"]:
            # Get the render task
            task = sdk.render_task(task_id)

            if task.status != "success":
                return (
                    f"Render task {task_id} is not complete. Status: {task.status}",
                    400,
                )

            # Get the render task results
            results = sdk.render_task_results(task_id)
            if results is None:
                return f"Render task {task_id} has no results", 400

            # Create individual PDF blob
            dashboard_id = task.dashboard_id
            individual_blob_name = f"{folder_name}/wbr-dashboard-{dashboard_id}.pdf"
            individual_blob = bucket.blob(individual_blob_name)

            # Upload individual PDF
            individual_blob.upload_from_string(results, content_type="application/pdf")
            individual_pdfs.append(individual_blob_name)

            # Add the PDF to the merger
            merger.append(io.BytesIO(results))

        # Create a new blob for the combined PDF
        combined_blob_name = f"{folder_name}/{folder_name}-combined-render-tasks.pdf"
        combined_blob = bucket.blob(combined_blob_name)

        # Write the combined PDF to a bytes buffer
        output_buffer = io.BytesIO()
        merger.write(output_buffer)
        output_buffer.seek(0)

        # Upload the combined PDF
        combined_blob.upload_from_file(output_buffer, content_type="application/pdf")

        return {
            "status": "success",
            "combined_pdf": combined_blob_name,
            "individual_pdfs": individual_pdfs,
            "number_of_pdfs_combined": len(request_json["render_task_ids"]),
        }

    except Exception as e:
        return f"Error combining render task results: {str(e)}", 500

import io
import os
from datetime import datetime, timezone

from google.cloud import storage
from PyPDF2 import PdfMerger
from werkzeug import Request

from functions.handle_artifacts import update_run_artifact
from functions.utils import get_sdk


def get_and_combine_render_tasks(request: Request) -> dict:
    """Get the results of multiple render tasks and combine them into a single PDF.

    Args:
        request: The request object containing render_task_ids and folder_name in the JSON body

    Returns:
        A dictionary containing the status and the combined PDF's blob name or an error message
    """
    sdk = get_sdk(request.environ.get("access_token"))
    request_json = request.get_json(silent=True)

    run_id = request_json.get("run_id")
    if not run_id:
        return "Please provide run_id in the request body", 400

    if not request_json or "render_task_ids" not in request_json:
        return "Please provide render_task_ids in the request body", 400

    folder_name = request_json.get("folder_name")
    if not folder_name:
        return "Please provide folder_name in the request body", 400

    try:
        # Initialize the storage client
        storage_client = storage.Client()
        bucket = storage_client.bucket(os.environ.get("GCP_BUCKET_NAME"))

        # Create a PDF merger
        merger = PdfMerger()
        individual_pdfs = []

        for task_id in request_json.get("render_task_ids", []):
            # Get the render task
            task = sdk.render_task(task_id)

            if task.status != "success":  # other option failure
                update_run_artifact(
                    request=request,
                    run_id=run_id,
                    errors=[
                        f"Render task {task_id} for dashboard {task.dashboard_id} is not complete. Status: {task.status}"
                    ],
                )

            # Get the render task results
            results = sdk.render_task_results(task_id)
            if results is None:
                update_run_artifact(
                    run_id=run_id,
                    errors=[
                        f"Render task {task_id} for dashboard {task.dashboard_id} has no results"
                    ],
                )

            # Create individual PDF blob
            dashboard_id = task.dashboard_id
            individual_blob_name = (
                f"{folder_name}/pdf-combiner-dashboard-{dashboard_id}.pdf"
            )
            individual_blob = bucket.blob(individual_blob_name)

            # Upload individual PDF
            individual_blob.upload_from_string(results, content_type="application/pdf")
            individual_pdfs.append(individual_blob_name)

            # Add the PDF to the merger
            merger.append(io.BytesIO(results))

        # Create a new blob for the combined PDF
        combined_blob_name = f"{folder_name}/{folder_name}-combined.pdf"
        combined_blob = bucket.blob(combined_blob_name)

        # Write the combined PDF to a bytes buffer
        output_buffer = io.BytesIO()
        merger.write(output_buffer)
        output_buffer.seek(0)

        # Upload the combined PDF
        combined_blob.upload_from_file(output_buffer, content_type="application/pdf")

        update_run_artifact(
            request=request,
            run_id=run_id,
            combined_pdf=combined_blob_name,
            individual_pdfs=individual_pdfs,
            number_of_pdfs_combined=len(request_json.get("render_task_ids", [])),
            finished_at=datetime.now(timezone.utc),
        )
        return {
            "status": "success",
            "combined_pdf": combined_blob_name,
            "individual_pdfs": individual_pdfs,
            "number_of_pdfs_combined": len(request_json.get("render_task_ids", [])),
        }

    except Exception as e:
        return f"Error combining render task results: {str(e)}", 500

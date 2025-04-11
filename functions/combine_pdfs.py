import io
import os

from google.cloud import storage
from PyPDF2 import PdfMerger
from werkzeug import Request


def combine_pdfs(request: Request) -> dict:
    """Combine all PDFs from a Google Cloud Storage folder into a single PDF.

    Args:
        request: The request object containing the folder_name in the JSON body

    Returns:
        A dictionary containing the status and the combined PDF's blob name or an error message
    """
    request_json = request.get_json(silent=True)
    if not request_json or "folder_name" not in request_json:
        return "Please provide a folder_name in the request body", 400

    try:
        # Initialize the storage client
        storage_client = storage.Client()
        bucket = storage_client.bucket(os.environ.get("GCP_BUCKET_NAME"))

        # List all blobs in the specified folder
        blobs = bucket.list_blobs(prefix=request_json["folder_name"])

        # Filter for PDF files
        pdf_blobs = [blob for blob in blobs if blob.name.lower().endswith(".pdf")]

        if not pdf_blobs:
            return "No PDF files found in the specified folder", 404

        # Create a PDF merger
        merger = PdfMerger()

        # Download and merge each PDF
        for blob in pdf_blobs:
            pdf_data = blob.download_as_bytes()
            merger.append(io.BytesIO(pdf_data))

        # Create a new blob for the combined PDF
        combined_blob_name = f"{request_json['folder_name']}/combined.pdf"
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
            "number_of_pdfs_combined": len(pdf_blobs),
        }

    except Exception as e:
        return f"Error combining PDFs: {str(e)}", 500

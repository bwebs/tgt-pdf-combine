from looker_sdk import init40
from looker_sdk.sdk.api40 import models
from werkzeug import Request

sdk = init40()


def create_render_task(request: Request) -> dict:
    """Create a render task for a specific dashboard.

    Args:
        request: The request object containing dashboard_id in the JSON body

    Returns:
        A dictionary containing the status and render_task_id or an error message
    """
    request_json = request.get_json(silent=True)
    if not request_json or "dashboard_id" not in request_json:
        return "Please provide a dashboard_id in the request body", 400

    try:
        # Create a render task for the dashboard
        render_task = sdk.create_dashboard_render_task(
            dashboard_id=request_json["dashboard_id"],
            result_format="pdf",
            width=1920,
            height=1080,
            pdf_paper_size="letter",
            pdf_landscape=True,
            long_tables=True,
            body=models.CreateDashboardRenderTask(dashboard_style="tiled"),
        )
        return {"status": "success", "render_task_id": render_task.id}
    except Exception as e:
        return f"Error creating render task: {str(e)}", 500

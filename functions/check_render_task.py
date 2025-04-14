from datetime import datetime, timedelta, timezone

from looker_sdk import init40
from werkzeug import Request

sdk = init40()

TIMEOUT_MINUTES = 30


def check_render_task(request: Request) -> dict:
    """Check the status of multiple render tasks.

    Args:
        request: The request object containing an array of render_task_ids in the JSON body

    Returns:
        A dictionary containing the status, success count, and details of each task
    """
    request_json = request.get_json(silent=True)
    render_task_id = request_json["render_task_id"]
    if not render_task_id:
        return "Please provide render_task_id in the request body", 400

    try:
        task = sdk.render_task(render_task_id)

        if task.created_at and (
            datetime.fromisoformat(task.created_at)
            < (datetime.now(timezone.utc) - timedelta(minutes=TIMEOUT_MINUTES))
        ):
            return (
                f"Render task {render_task_id} timed out after {TIMEOUT_MINUTES} minutes",
                400,
            )

        task_details = {
            "render_task_id": render_task_id,
            "status": task.status,
            "error": task.error if hasattr(task, "error") else None,
        }

        is_finished = task.status in ["success", "failure"]
        is_success = task.status == "success"

        return {
            "status": task.status,
            "finished": is_finished,
            "succeeded": is_success,
            "task_details": task_details,
        }
    except Exception as e:
        return f"Error checking render task: {str(e)}", 500

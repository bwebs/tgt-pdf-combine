from datetime import datetime, timedelta, timezone

from werkzeug import Request

from functions.handle_artifacts import update_run_dashboard_artifact
from functions.utils import get_sdk

TIMEOUT_MINUTES = 30


def check_render_task(request: Request) -> dict:
    """Check the status of multiple render tasks.

    Args:
        request: The request object containing an array of render_task_ids in the JSON body

    Returns:
        A dictionary containing the status, success count, and details of each task
    """
    request_json = request.get_json(silent=True)
    render_task_id = request_json.get("render_task_id")
    if not render_task_id:
        return "Please provide render_task_id in the request body", 400

    dashboard_id = request_json.get("dashboard_id")
    if not dashboard_id:
        return "Please provide dashboard_id in the request body", 400

    run_id = request_json.get("run_id")
    if not run_id:
        return "Please provide run_id in the request body", 400

    try:
        sdk = get_sdk(
            access_token=request.environ.get("access_token"),
            looker_sdk_base_url=request.environ.get("looker_sdk_base_url"),
        )
        task = sdk.render_task(render_task_id)

        if task.created_at and (
            datetime.fromisoformat(task.created_at)
            < (datetime.now(timezone.utc) - timedelta(minutes=TIMEOUT_MINUTES))
        ):
            update_run_dashboard_artifact(
                request=request,
                dashboard_id=dashboard_id,
                run_id=run_id,
                error=f"Render task {render_task_id} timed out after {TIMEOUT_MINUTES} minutes",
            )
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

        update_run_dashboard_artifact(
            request=request,
            dashboard_id=dashboard_id,
            run_id=run_id,
            task=task,
            finished_at=datetime.now(timezone.utc) if is_finished else None,
        )

        return {
            "status": task.status,
            "finished": is_finished,
            "succeeded": is_success,
            "task_details": task_details,
        }
    except Exception as e:
        update_run_dashboard_artifact(
            request=request,
            dashboard_id=dashboard_id,
            run_id=run_id,
            error=str(e),
            finished_at=datetime.now(timezone.utc),
        )
        return f"Error checking render task: {str(e)}", 500

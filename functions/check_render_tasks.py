from looker_sdk import init40
from werkzeug import Request

sdk = init40()


def check_render_tasks(request: Request) -> dict:
    """Check the status of multiple render tasks.

    Args:
        request: The request object containing an array of render_task_ids in the JSON body

    Returns:
        A dictionary containing the status, success count, and details of each task
    """
    request_json = request.get_json(silent=True)
    if not request_json or "render_task_ids" not in request_json:
        return "Please provide render_task_ids in the request body", 400

    try:
        results = []
        success_count = 0

        for task_id in request_json["render_task_ids"]:
            task = sdk.render_task(task_id)
            results.append(
                {
                    "render_task_id": task_id,
                    "status": task.status,
                    "error": task.error if hasattr(task, "error") else None,
                }
            )

            if task.status == "success":
                success_count += 1

        all_finished = all(
            result["status"] in ["success", "failure"] for result in results
        )

        return {
            "status": "success",
            "all_finished": all_finished,
            "success_count": success_count,
            "total_tasks": len(results),
            "task_details": results,
        }
    except Exception as e:
        return f"Error checking render tasks: {str(e)}", 500

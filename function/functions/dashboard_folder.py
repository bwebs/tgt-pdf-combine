from datetime import datetime, timezone

from werkzeug import Request

from functions.handle_artifacts import update_run_artifact
from functions.utils import get_sdk


def get_dashboard_ids_from_folder(request: Request) -> list:
    """Get all dashboard IDs from a specific Looker folder."""
    sdk = get_sdk(
        access_token=request.environ.get("access_token"),
        looker_sdk_base_url=request.environ.get("looker_sdk_base_url"),
    )
    request_json = request.get_json(silent=True)
    folder_id = request_json.get("folder_id")
    if not folder_id:
        return "Please provide a folder_id in the request body", 400
    run_id = request_json.get("run_id")
    if not run_id:
        return "Please provide a run_id in the request body", 400

    try:
        # Search for dashboards in the specified folder
        dashboards = sdk.search_dashboards(folder_id=folder_id, sorts="title")

    except Exception as e:
        update_run_artifact(
            request=request,
            run_id=run_id,
            folder_id=folder_id,
            dashboard_ids=[],
            errors=[str(e)],
            finished_at=datetime.now(timezone.utc),
        )
        return f"Error retrieving dashboards: {str(e)}", 500

    # Extract dashboard IDs
    dashboard_ids = [dashboard.id for dashboard in dashboards]
    update_run_artifact(
        request=request, run_id=run_id, folder_id=folder_id, dashboard_ids=dashboard_ids
    )
    return {"dashboard_ids": dashboard_ids, "dashboard_count": len(dashboard_ids)}

from looker_sdk import init40
from werkzeug import Request

sdk = init40()


def get_dashboard_ids_from_folder(request: Request) -> list:
    """Get all dashboard IDs from a specific Looker folder."""

    request_json = request.get_json(silent=True)
    if not request_json or "folder_id" not in request_json:
        return "Please provide a folder_id in the request body", 400

    try:
        # Search for dashboards in the specified folder
        dashboards = sdk.search_dashboards(folder_id=request_json["folder_id"])

    except Exception as e:
        return f"Error retrieving dashboards: {str(e)}", 500

    # Extract dashboard IDs
    dashboard_ids = [dashboard.id for dashboard in dashboards]
    return {"dashboard_ids": dashboard_ids, "dashboard_count": len(dashboard_ids)}

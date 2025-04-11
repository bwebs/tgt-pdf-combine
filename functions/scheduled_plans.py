import json
import os

from looker_sdk import init40
from looker_sdk.sdk.api40.models import ScheduledPlanDestination, WriteScheduledPlan
from werkzeug import Request

sdk = init40()


def run_dashboard_scheduled_plan(request: Request) -> dict:
    """Run a scheduled plan for a specific dashboard once."""

    request_json = request.get_json(silent=True)
    dashboard_id = request_json["dashboard_id"]
    if not dashboard_id:
        return "Please provide a dashboard_id in the request body", 400

    folder_name = request_json.get("folder_name")
    if not folder_name:
        return "Please provide a folder_name in the request body", 400

    try:
        # Get the action ID from environment variable
        action_id = os.environ.get("LOOKER_ACTION_ID")
        if not action_id:
            return "LOOKER_ACTION_ID environment variable is not set", 400

        # Create a scheduled plan for the dashboard
        scheduled_plan = sdk.create_scheduled_plan(
            WriteScheduledPlan(
                name=f"WBR run for dashboard {dashboard_id}",
                dashboard_id=dashboard_id,
                run_once=True,
                pdf_landscape=True,
                embed=True,
                pdf_paper_size="letter",
                scheduled_plan_destination=[
                    ScheduledPlanDestination(
                        format="json",
                        apply_formatting=True,
                        apply_vis=True,
                        address="",
                        type="action",
                        action_id=action_id,
                        parameters=json.dumps(
                            {
                                "bucket": "lkr-wbr-dashboard-examples",
                                "filename": f"{folder_name}w/wbr-{dashboard_id}",
                                "overwrite": "yes",
                            }
                        ),
                    )
                ],
            )
        )

        # Run the scheduled plan
        result = sdk.scheduled_plan_run_once(scheduled_plan.id)
        return {"status": "success", "scheduled_plan_id": scheduled_plan.id}
    except Exception as e:
        return f"Error running scheduled plan: {str(e)}", 500

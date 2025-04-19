import json
from typing import List

from looker_sdk.sdk.api40.models import RenderTask, UpdateArtifact
from werkzeug import Request

from functions.utils import get_sdk

RUN_NAMESPACE = "combine-dashboards-tool-runs"
DASHBOARD_NAMESPACE = "combine-dashboards-tool-run-dashboards"


def update_run_artifact(
    request: Request,
    run_id: str,
    folder_id: str | None = None,
    finished_at: str | None = None,
    errors: List[str] = [],
    dashboard_ids: List[str] = [],
    **kwargs,
) -> dict:
    sdk = get_sdk(
        access_token=request.environ.get("access_token"),
        looker_sdk_base_url=request.environ.get("looker_sdk_base_url"),
    )
    key = f"{run_id}"
    previous = sdk.artifact(
        namespace=RUN_NAMESPACE,
        key=key,
    )
    body = dict()
    if previous:
        previous = previous[0]
        if "content_type" in previous and previous.content_type == "application/json":
            body = json.loads(previous.value)

    body["run_id"] = run_id

    if folder_id:
        body["folder_id"] = folder_id
    if dashboard_ids:
        body["dashboard_ids"] = dashboard_ids
    if finished_at:
        body["finished_at"] = finished_at.isoformat()
        body["status"] = "finished"
    if not finished_at:
        body["status"] = "running"
    if kwargs:
        body.update(kwargs)
    if errors:
        body["errors"] = [*previous.errors, *errors] if previous.errors else errors
    if "errors" in body:
        body["status"] = "error"

    artifact = UpdateArtifact(
        key=key,
        version=previous.version if previous and previous.version else None,
        content_type="application/json",
        value=json.dumps(body),
    )
    sdk.update_artifacts(namespace=RUN_NAMESPACE, body=[artifact])


def update_run_dashboard_artifact(
    request: Request,
    dashboard_id: str,
    run_id: str,
    error: str | None = None,
    finished_at: str | None = None,
    task: RenderTask | None = None,
    **kwargs,
) -> dict:
    sdk = get_sdk(
        access_token=request.environ.get("access_token"),
        looker_sdk_base_url=request.environ.get("looker_sdk_base_url"),
    )
    key = f"{run_id}-{dashboard_id}"
    previous = sdk.artifact(namespace=DASHBOARD_NAMESPACE, key=key)
    body = dict()
    if previous:
        previous = previous[0]
        if "content_type" in previous and previous.content_type == "application/json":
            body = json.loads(previous.value)

    body["dashboard_id"] = dashboard_id
    body["run_id"] = run_id

    if error:
        body["error"] = error
    if finished_at:
        body["finished_at"] = finished_at.isoformat()
    if task:
        body["result_task_id"] = task.id
        body["status"] = task.status
    if kwargs:
        body.update(kwargs)

    artifact = UpdateArtifact(
        key=key,
        content_type="application/json",
        version=previous.version if previous and previous.version else None,
        value=json.dumps(body),
    )
    sdk.update_artifacts(namespace=DASHBOARD_NAMESPACE, body=[artifact])
    return {"message": "Dashboard updated"}

import os

from functions_framework import http
from werkzeug import Request

from functions.check import check
from functions.check_render_task import check_render_task
from functions.combine_render_tasks import get_and_combine_render_tasks
from functions.create_render_task import create_render_task
from functions.dashboard_folder import get_dashboard_ids_from_folder
from functions.dashboard_lookml import get_and_combine_dashboard_lookml
from functions.execute_workflow import execute_workflow
from functions.get_signed_url import get_signed_url


@http
def main(request: Request):
    """HTTP Cloud Function that handles various Looker operations.
    Args:
        request (flask.Request): The request object.
        <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
        <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
    """
    do = request.args.get("do", "")
    authorization = request.headers.get("authorization", "")
    access_token = request.headers.get("x-access-token", "")
    looker_sdk_base_url = request.headers.get("x-lookersdk-base-url", "")

    # sdk can be logged in with
    if access_token:
        if not looker_sdk_base_url:
            return {"message": "Unauthorized"}, 401
        request.environ["access_token"] = access_token
        request.environ["looker_sdk_base_url"] = looker_sdk_base_url

    elif authorization:
        request.environ["auth"] = "api"
    if not authorization:
        return {"message": "Unauthorized"}, 401

    if not access_token and (authorization != os.getenv("PDF_COMBINER_SECRET")):
        return {"message": "Unauthorized"}, 401

    if do == "execute_workflow":
        return execute_workflow(request)
    elif do == "folder_dashboards":
        return get_dashboard_ids_from_folder(request)
    elif do == "dashboard_lookml":
        return get_and_combine_dashboard_lookml(request)
    elif do == "render_task":
        return create_render_task(request)
    elif do == "check_render_task":
        return check_render_task(request)
    elif do == "combine_render_tasks":
        return get_and_combine_render_tasks(request)
    elif do == "get_signed_url":
        return get_signed_url(request)
    elif do == "check":
        return check(request)
    else:
        return {"message": "Invalid request"}, 400

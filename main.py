from functions_framework import http
from werkzeug import Request

from functions.check_render_task import check_render_task
from functions.combine_render_tasks import get_and_combine_render_tasks
from functions.create_render_task import create_render_task
from functions.dashboard_folder import get_dashboard_ids_from_folder
from functions.dashboard_lookml import get_and_combine_dashboard_lookml


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

    if do == "":
        return {"message": "Hello, World!"}
    if do == "folder_dashboards":
        return get_dashboard_ids_from_folder(request)
    if do == "dashboard_lookml":
        return get_and_combine_dashboard_lookml(request)
    if do == "render_task":
        return create_render_task(request)
    if do == "check_render_task":
        return check_render_task(request)
    if do == "combine_render_tasks":
        return get_and_combine_render_tasks(request)

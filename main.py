from functions_framework import http
from werkzeug import Request

from functions.check_render_tasks import check_render_tasks
from functions.combine_pdfs import combine_pdfs
from functions.combine_render_tasks import get_and_combine_render_tasks
from functions.create_render_task import create_render_task
from functions.dashboard_folder import get_dashboard_ids_from_folder
from functions.dashboard_lookml import get_and_combine_dashboard_lookml
from functions.scheduled_plans import run_dashboard_scheduled_plan
from functions.storage_operations import list_files_in_folder


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
    if request.path == "/":
        return NotImplemented, 501
    if request.path == "/folder_dashboards":
        return get_dashboard_ids_from_folder(request)
    if request.path == "/dashboards":
        return run_dashboard_scheduled_plan(request)
    if request.path == "/check_folder":
        return list_files_in_folder(request)
    if request.path == "/combine_pdfs":
        return combine_pdfs(request)
    if request.path == "/dashboard_lookml":
        return get_and_combine_dashboard_lookml(request)
    if request.path == "/render_task":
        return create_render_task(request)
    if request.path == "/check_render_tasks":
        return check_render_tasks(request)
    if request.path == "/combine_render_tasks":
        return get_and_combine_render_tasks(request)

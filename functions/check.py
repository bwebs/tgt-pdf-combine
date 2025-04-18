from requests import Request

from functions.utils import get_sdk


def check(request: Request):
    sdk = get_sdk(
        access_token=request.environ.get("access_token"),
        looker_sdk_base_url=request.environ.get("looker_sdk_base_url"),
    )
    me = sdk.me(fields="id")
    if me and me.id:
        return {"status": "success"}
    else:
        return {"status": "failure"}, 404

    return {"status": "success"}

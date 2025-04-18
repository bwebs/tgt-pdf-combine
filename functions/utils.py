import json
import os

from looker_sdk import init40
from looker_sdk.rtl.api_settings import PApiSettings
from looker_sdk.rtl.auth_session import AuthSession
from looker_sdk.rtl.auth_token import AuthToken
from looker_sdk.rtl.serialize import serialize
from looker_sdk.rtl.transport import Transport
from looker_sdk.sdk.api40.methods import Looker40SDK as Looker40SDKBase


def init40AccessToken(
    looker_sdk_base_url: str,
    access_token: str | None = None,
) -> Looker40SDKBase:
    """Default dependency configuration"""
    if not looker_sdk_base_url:
        raise Exception("looker_sdk_base_url is required with access_token")
    if not access_token:
        raise Exception("access_token is required")
    settings = PApiSettings(
        base_url=looker_sdk_base_url,
    )
    settings.is_configured()
    transport = Transport.configure(settings)
    auth = AuthSession(settings, transport, serialize.deserialize40, "4.0")
    auth._sudo_id = "-1"
    if access_token:
        try:
            t = json.loads(access_token)
        except Exception:
            pass
        auth.sudo_token = AuthToken(**t)
    if not auth.sudo_token.access_token:
        raise Exception("Invalid access token")

    return Looker40SDKBase(
        auth,
        serialize.deserialize40,
        serialize.serialize40,
        transport,
        "4.0",
    )


def get_sdk(access_token: str | None = None, looker_sdk_base_url: str | None = None):
    if access_token and looker_sdk_base_url:
        if os.environ.get("MULTITENANT") != "true":
            raise Exception(
                "MULTITENANT is not rue, access_token and looker_sdk_base_url shouldn't be used"
            )
        return init40AccessToken(
            looker_sdk_base_url=looker_sdk_base_url, access_token=access_token
        )
    else:
        if os.environ.get("MULTITENANT") == "true":
            raise Exception(
                "MULTITENANT is true, access_token and looker_sdk_base_url are required"
            )
        return init40()

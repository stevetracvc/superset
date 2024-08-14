import logging
import os

basedir = os.path.abspath(os.path.dirname(__file__))

# AUTH_USER_REGISTRATION = True
# AUTH_USER_REGISTRATION_ROLE = "User_company_restricted_access" # "User_general_permissions"

import logging

logger = logging.getLogger()

try:
    import superset_config_oauth
    from custom_sso_security_manager import CustomSsoSecurityManager
    from flask_appbuilder.security.manager import AUTH_OAUTH
    from superset_config_oauth import (  # noqa
        CLIENT_ID,
        CLIENT_SECRET,
        LOGOUT_REDIRECT_URI,
    )

    CUSTOM_SECURITY_MANAGER = CustomSsoSecurityManager
    AUTH_TYPE = AUTH_OAUTH

    logger.info(
        f"Loaded your OAuth configuration at " f"[{superset_config_oauth.__file__}]"
    )
except ImportError:
    logger.info("Using default Docker config...")
    CLIENT_ID = ""
    CLIENT_SECRET = ""
    LOGOUT_REDIRECT_URI = ""


COGNITO_URL = "https://tracvc.auth.us-west-2.amazoncognito.com/"

OAUTH_PROVIDERS = [
    {
        "name": "cognito",
        "token_key": "access_token",
        "icon": "fa-amazon",
        "url": COGNITO_URL,
        "remote_app": {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "request_token_params": {"scope": "email openid profile"},
            #        'response_type': 'token',
            "response_type": "code",
            "base_url": os.path.join(COGNITO_URL, "oauth2/idpresponse"),
            "access_token_url": os.path.join(COGNITO_URL, "oauth2/token"),
            "authorize_url": os.path.join(COGNITO_URL, "oauth2/authorize"),
            "access_token_method": "POST",
            "request_token_url": None,
            #        'request_token_url': os.path.join(COGNITO_URL, 'oauth2/token'),
            "api_base_url": COGNITO_URL,
            "logout_url": os.path.join(COGNITO_URL, "logout"),
            "logout_redirect_uri": LOGOUT_REDIRECT_URI,
        },
    }
]

FEATURE_FLAGS = {
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    #    "DASHBOARD_NATIVE_FILTERS_SET": True,
    "DASHBOARD_FILTERS_EXPERIMENTAL": True,
    "ENABLE_EXPLORE_DRAG_AND_DROP": True,
    "ENABLE_DND_WITH_CLICK_UX": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "ENABLE_TEMPLATE_REMOVE_FILTERS": True,
    "DYNAMIC_PLUGINS": True,
    "DASHBOARD_RBAC": True,
    #    "ENABLE_REACT_CRUD_VIEWS": True,
    "DASHBOARD_EDIT_CHART_IN_NEW_TAB": True,
}

#
# Flask session cookie options
#
# See https://flask.palletsprojects.com/en/1.1.x/security/#set-cookie-options
# for details
#
SESSION_COOKIE_HTTPONLY = True  # Prevent cookie from being read by frontend JS?
SESSION_COOKIE_SECURE = False  # Prevent cookie from being transmitted over non-tls?
SESSION_COOKIE_SAMESITE = "Lax"  # One of [None, 'Lax', 'Strict']
# for embedding in iframe
# https://github.com/apache/incubator-superset/issues/8382
SESSION_COOKIE_HTTPONLY = False
# SESSION_COOKIE_SAMESITE = None # One of [None, 'Lax', 'Strict']

# when it's added to systemd
# https://unix.stackexchange.com/questions/462075/systemd-service-not-recognizing-python-library
SUPERSET_LOAD_EXAMPLES = "no"

ROW_LIMIT = 50000
VIZ_ROW_LIMIT = 10000000
SQL_MAX_ROW = 10000000
DISPLAY_MAX_ROWS = 1000000
# max rows retreieved when requesting samples from datasource in explore view
SAMPLES_ROW_LIMIT = 1000
# max rows retrieved by filter select auto complete
FILTER_SELECT_ROW_LIMIT = 10000

APP_ICON = "/static/assets/images/TRAC-logo.png"
APP_ICON_WIDTH = 126
LOGO_TARGET_PATH = "https://www.tracvc.com"
FAVICONS = [{"href": "/static/assets/images/cropped-TRAC_Icon-1-32x32.png"}]

# not sure I need it
# ENABLE_CORS = False
ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": [
        "X-CSRFToken",
        "Content-Type",
        "Origin",
        "X-Requested-With",
        "Accept",
    ],
    "resources": [
        "/superset/csrf_token/",  # auth
        "/api/v1/formData/",  # sliceId => formData
        "/superset/explore_json/*",  # legacy query API, formData => queryData
        "/api/v1/query/",  # new query API, queryContext => queryData
        "/superset/fetch_datasource_metadata/",  # datasource metadata
        "/superset/dashboard/",  # datasource metadata
        "/oauth-authorized/cognito",
    ],
    "origins": ["https://tracvc.ddns.net"],
}

# we might need to update this more...
EMAIL_NOTIFICATIONS = False  # all the emails are sent using dryrun
SMTP_HOST = "localhost"
SMTP_STARTTLS = True
SMTP_SSL = False
SMTP_USER = "superset"
SMTP_PORT = 25
SMTP_PASSWORD = "superset"
SMTP_MAIL_FROM = "admin@tracvc.com"


CACHE_CONFIG = {
    "CACHE_TYPE": "redis",
    "CACHE_DEFAULT_TIMEOUT": 60 * 60 * 24 * 30,  # 30 days (in secs)
    "CACHE_KEY_PREFIX": "superset_results",
    #    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    "CACHE_REDIS_URL": "redis://redis:6379/0",
}
DATA_CACHE_CONFIG = {
    **CACHE_CONFIG,
    'CACHE_KEY_PREFIX': 'superset_results_data',
}
FILTER_STATE_CACHE_CONFIG = {
    **CACHE_CONFIG,
    'CACHE_KEY_PREFIX': 'superset_results_filter',
}
EXPLORE_FORM_DATA_CACHE_CONFIG = {
    **CACHE_CONFIG,
    'CACHE_KEY_PREFIX': 'superset_results_explore',
}

from celery.schedules import crontab
CELERYBEAT_SCHEDULE = {
    'cache-warmup-hourly': {
        'task': 'cache-warmup',
        'schedule': crontab(minute=9, hour='*'),  # hourly
        'kwargs': {
            'strategy_name': 'top_n_dashboards',
            'top_n': 5,
            'since': '7 days ago',
        },
    },
}
# Use all X-Forwarded headers when ENABLE_PROXY_FIX is True.
# When proxying to a different port, set "x_port" to 0 to avoid downstream issues.
ENABLE_PROXY_FIX = True
PROXY_FIX_CONFIG = {"x_for": 1, "x_proto": 1, "x_host": 1, "x_port": 0, "x_prefix": 1}
SUPERSET_WEBSERVER_PROTOCOL = "https"


def custom_escape_array(array, original, replacement):
    return [x.replace(original, replacement) for x in array]

def custom_escape_array2(array, pairs):
    arr = array
    for pair in pairs:
        arr = [x.replace(pair[0], pair[1]) for x in arr]
    return arr

def flatten(arr_2d):
    return [item for row in arr_2d for item in row]


import metaphone


JINJA_CONTEXT_ADDONS = {
    'custom_escape_array': custom_escape_array,
    'custom_escape_array2': custom_escape_array2,
    'dm': metaphone.dm,
    'flatten': flatten,
    'map': map,
}


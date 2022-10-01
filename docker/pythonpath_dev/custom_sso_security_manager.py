from superset.security import SupersetSecurityManager
import logging
logger = logging.getLogger('auth0_login')
log = logger

import json

from flask_appbuilder.security.views import AuthOAuthView
from flask_appbuilder.baseviews import expose
import time
from flask import redirect

class CustomSsoAuthOAuthView(AuthOAuthView):

    @expose("/login/")
    def login(self, provider="cognito"):
        return super().login(provider=provider) #, register = None)

    @expose("/logout/")
    def logout(self, provider="cognito", register=None):
        provider_obj = self.appbuilder.sm.oauth_remotes[provider]
#        url = ("logout?client_id={}&logout_uri={}".format(
        url = ("logout?client_id={}&response_type={}&redirect_uri={}".format(
                  provider_obj.client_id,
                  provider_obj.server_metadata.get('response_type'),
#                  urllib.parse.quote_plus(provider_obj.server_metadata.get('logout_redirect_uri')),
#                  urllib.parse.quote_plus(provider_obj.server_metadata.get('logout_redirect_uri')),
#                  provider_obj.server_metadata.get('logout_redirect_uri'),
                  provider_obj.server_metadata.get('logout_redirect_uri')
                  ) )
        logger.debug( "url: {}".format(url) )

#        logger.debug( "sending curl request to logout" )
#        res = self.appbuilder.sm.oauth_remotes[provider].get(url, withhold_token=True)

        ret = super().logout()
        logger.debug( "DONE!" )
        time.sleep(1)

        return redirect("{}{}".format( provider_obj.api_base_url, url ) )


class CustomSsoSecurityManager(SupersetSecurityManager):

    # override the logout function
    authoauthview = CustomSsoAuthOAuthView

    def oauth_user_info(self, provider, response=None):
        if provider == 'cognito':
            res = self.appbuilder.sm.oauth_remotes[provider].get('oauth2/userInfo') # https://tracvc.auth.us-west-2.amazoncognito.com/oauth2/userInfo')
            if res.raw.status != 200:
                logger.error('Failed to obtain user info: %s', res.data)
                return
            me = json.loads(res._content)
            logger.debug("****user_data: %s", me)
            prefix = 'Superset'
            return {
                'username' : me['username'],
#                'name' : me['name'],
                'email' : me['email'],
#                'first_name': me['given_name'],
#                'last_name': me['family_name'],
            }
        if provider == 'google':
            res = self.appbuilder.sm.oauth_remotes[provider].get('userinfo')
            if res.raw.status != 200:
                logger.error('Failed to obtain user info: %s', res.data)
                return
            me = json.loads(res._content)
            logger.debug(" user_data: %s", me)
            prefix = 'Superset'
            return {
#                'user' : me['email'],
#                'username' : me['name'],
                'name' : me['name'],
                'email' : me['email'],
                'first_name': me['given_name'],
                'last_name': me['family_name'],
            }


    def auth_user_oauth(self, userinfo):
        """
            Method for authenticating user with OAuth.

            :userinfo: dict with user information
                       (keys are the same as User model columns)
        """
        # extract the username from `userinfo`
        if "username" in userinfo:
            user = self.find_user(username=userinfo["username"])
        if user is None and "email" in userinfo:
            user = self.find_user(email=userinfo["email"])
        if user is None:
            log.error(
                "OAUTH userinfo does not have username or email {0}".format(userinfo)
            )
            return None

#        # If username is empty, go away
#        if (username is None) or username == "":
#            return None
#
#        # Search the DB for this user
#        user = self.find_user(username=username)

        logger.error(f"ZZZZZZZZZZZZZZ: {user}")
        # If user is not active, go away
        if user and (not user.is_active):
            return None

        # If user is not registered, and not self-registration, go away
        if (not user) and (not self.auth_user_registration):
            return None

        # Sync the user's roles
        if user and self.auth_roles_sync_at_login:
            user.roles = self._oauth_calculate_user_roles(userinfo)
            log.debug(
                "Calculated new roles for user='{0}' as: {1}".format(
                    username, user.roles
                )
            )

        # If the user is new, register them
        if (not user) and self.auth_user_registration:
            user = self.add_user(
                username=username,
                first_name=userinfo.get("first_name", ""),
                last_name=userinfo.get("last_name", ""),
                email=userinfo.get("email", "") or f"{username}@email.notfound",
                role=self._oauth_calculate_user_roles(userinfo),
            )
            log.debug("New user registered: {0}".format(user))


            # If user registration failed, go away
            if not user:
                log.error("Error creating a new OAuth user {0}".format(username))
                return None

        # LOGIN SUCCESS (only if user is now registered)
        if user:
            self.update_user_auth_stat(user)
            return user
        else:
            return None


"""
This can be used to auto add them to groups, if Cognito stops sucking ass and passes group info to us

def oauth_user_info(self, provider, response=None):
    if provider == 'nameOfProvider':
        res = self.appbuilder.sm.oauth_remotes[provider].get('userinfo')
        if res is None:
            logger.error('Failed to obtain user info: %s', res.data)
            return
        me = res.json()
        user_info = {
            'username': me['preferred_username'],
            'name': '',
            'email': me['email'],
            'first_name': me['given_name'],
            'last_name': me['family_name'],
        }
        groups = self.getGroups(me)
        logger.debug(" filtered group %s", groups)
        user_info.__setitem__("roles", groups)
        return user_info

def getGroups(self, me):
    prefix = os.environ.get('Group_Common_Prefix')
    logger.info('prefix: ' + prefix)
    groups = []
    if 'groups' in me:
        groups = [
            x.replace(prefix, '').strip() for x in me['groups']
            if x.startswith(prefix)
        ]
    else:
        logger.error('Failed to obtain user info groups: %s', me)
    return groups
def auth_user_oauth(self, userinfo):
    user = super(CustomSsoSecurityManager, self).auth_user_oauth(userinfo)
    if 'roles' in userinfo:
        roles = [self.find_role(x) for x in userinfo['roles']]
        roles = [x for x in roles if x is not None]
        user.roles = roles
        logger.debug(' Update <User: %s> role to %s', user.username, roles)
        self.update_user(user)  # update user roles
    return user
"""




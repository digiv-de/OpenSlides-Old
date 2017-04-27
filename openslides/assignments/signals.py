from django.apps import apps

from ..utils.auth import has_perm
from ..utils.collection import Collection
from .models import Assignment


def get_permission_change_data(sender, permissions=None, **kwargs):
    """
    Yields all necessary collections if 'assignments.can_see' permission changes.
    """
    assignments_app = apps.get_app_config(app_label='assignments')
    for permission in permissions:
        # There could be only one 'assignment.can_see' and then we want to return data.
        if permission.content_type.app_label == assignments_app.label and permission.codename == 'can_see':
            yield from assignments_app.get_startup_elements()


def is_user_data_required(sender, request_user, user_data, **kwargs):
    """
    If request_user can see assignments, then returns all user ids that are
    displayed as candidates (including poll options). Else, it returns an empty set.
    """
    user_ids = set()
    if has_perm(request_user, 'assignments.can_see'):
        for assignment_collection_element in Collection(Assignment.get_collection_string()).element_generator():
            full_data = assignment_collection_element.get_full_data()
            user_ids.update(related_user['user_id'] for related_user in full_data['assignment_related_users'])
            for poll in full_data['polls']:
                user_ids.update(option['candidate_id'] for option in poll['options'])
    return user_ids

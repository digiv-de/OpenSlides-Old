from typing import Any, Dict, List, Optional, cast

from openslides.core.config import config
from openslides.core.models import Projector
from openslides.users.models import User
from openslides.utils.projector import (
    ProjectorAllDataProvider,
    get_config,
    register_projector_slide,
)


class TConfig:
    """
    Cachable, that fills the cache with the default values of the config variables.
    """

    personalized_model = False

    def get_collection_string(self) -> str:
        return config.get_collection_string()

    def get_elements(self) -> List[Dict[str, Any]]:
        elements = []
        config.key_to_id = {}
        for id, item in enumerate(config.config_variables.values()):
            elements.append(
                {"id": id + 1, "key": item.name, "value": item.default_value}
            )
            config.key_to_id[item.name] = id + 1
        return elements

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return elements


class TUser:
    """
    Cachable, that fills the cache with fake users.
    """

    personalized_model = False

    def get_collection_string(self) -> str:
        return User.get_collection_string()

    def get_elements(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": 1,
                "username": "admin",
                "title": "",
                "first_name": "",
                "last_name": "Administrator",
                "structure_level": "",
                "number": "",
                "about_me": "",
                "groups_id": [4],
                "is_present": False,
                "is_committee": False,
                "email": "",
                "last_email_send": None,
                "comment": "",
                "is_active": True,
                "default_password": "admin",
                "session_auth_hash": "362d4f2de1463293cb3aaba7727c967c35de43ee",
            }
        ]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return elements


class TProjector:
    """
    Cachable, that mocks the projector.
    """

    personalized_model = False

    def get_collection_string(self) -> str:
        return Projector.get_collection_string()

    def get_elements(self) -> List[Dict[str, Any]]:
        return [
            {"id": 1, "elements": [{"name": "test/slide1", "id": 1}]},
            {"id": 2, "elements": [{"name": "test/slide2", "id": 1}]},
        ]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return elements


async def slide1(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Slide that shows the general_event_name.
    """
    return {
        "name": "slide1",
        "event_name": await get_config(all_data_provider, "general_event_name"),
    }


async def slide2(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    return {"name": "slide2"}


register_projector_slide("test/slide1", slide1)
register_projector_slide("test/slide2", slide2)


class TestProjectorAllDataProvider:
    def __init__(self, data):
        self.data = data

    async def get(self, collection: str, id: int) -> Optional[Dict[str, Any]]:
        collection_data = await self.get_collection(collection)
        return collection_data.get(id)

    async def get_collection(self, collection: str) -> Dict[int, Dict[str, Any]]:
        return self.data.get(collection, {})

    async def exists(self, collection: str, id: int) -> bool:
        return (await self.get(collection, id)) is not None


def get_all_data_provider(data) -> ProjectorAllDataProvider:
    data[TConfig().get_collection_string()] = {
        element["id"]: element for element in TConfig().get_elements()
    }
    data[TUser().get_collection_string()] = {
        element["id"]: element for element in TUser().get_elements()
    }
    return cast(ProjectorAllDataProvider, TestProjectorAllDataProvider(data))

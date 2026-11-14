"""Shared fixtures for the homepage e2e suite.

Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/homepage
"""
import os
import pathlib

import pytest

SHOTS = pathlib.Path(__file__).parent / "screenshots"
BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture
def shot():
    SHOTS.mkdir(exist_ok=True)

    def _shot(target, name, **kwargs):
        # target is a Page or a Locator
        target.screenshot(path=str(SHOTS / f"{name}.png"), **kwargs)

    return _shot

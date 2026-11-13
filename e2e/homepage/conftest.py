"""Shared fixtures for the homepage e2e suite.

Run against a local or dev URL, never production:
    E2E_BASE_URL=http://localhost:3000 pytest e2e/homepage
"""
import os

import pytest

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000").rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture
def api(pw, base_url):
    req = pw.request.new_context(base_url=base_url)
    yield req
    req.dispose()

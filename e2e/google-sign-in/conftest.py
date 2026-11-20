"""Shared fixtures for the google-sign-in e2e suite (docs/features/google-sign-in.md).

Task 01 (OAuth client and auth secrets) is infra only, so its scenarios are static checks of the
committed repo, workflow and docs. They need no server and no credentials. Checks that need the
Google Cloud console, the GitHub Environment `dev` or Cloudflare (`wrangler secret list`) are
BLOCKED (skipped with the reason). Browser scenarios arrive per task: tasks 06 and 07 cover
US-google-sign-in-1, 2 and 4; US-3, 5 and 6 are added by task 10. Never run against production.
"""
import pytest
import yaml

from helpers import ROOT

SECRETS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "BETTER_AUTH_SECRET"]


@pytest.fixture(scope="session")
def secrets():
    return SECRETS


@pytest.fixture(scope="session")
def workflow():
    return yaml.safe_load((ROOT / ".github/workflows/deploy-dev.yml").read_text())


@pytest.fixture(scope="module")
def browser(pw):
    b = pw.chromium.launch()
    yield b
    b.close()


@pytest.fixture
def ctx(browser):
    c = browser.new_context(viewport={"width": 1440, "height": 900})
    yield c
    c.close()

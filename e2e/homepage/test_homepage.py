"""E2E tests for the homepage feature (docs/features/homepage.md).

Single file for the feature, per the e2e-from-user-stories skill. Task 12
(e2e-homepage) adds the remaining US-homepage scenarios here. Public session,
no cookies.

Already covered: US-homepage-8.4 (pinned by task H0,
docs/tasks/homepage/00-pin-copy-from-decisions.md).
"""
import pytest

# Collaboration-sensitive strings from spec Conflict 1. A Memory has one owner
# and no contributor or invite feature exists, so the page must not promise it.
UNBUILT_FEATURE_PHRASES = ["add to", "Invite people", "just added a photo", "12 cousins"]


@pytest.fixture(scope="module")
def home_html(pw, base_url):
    """Raw HTML of `/`, fetched once, with no cookies."""
    req = pw.request.new_context(base_url=base_url)
    try:
        r = req.get("/")
        assert r.status == 200
        yield r.text().lower()
    finally:
        req.dispose()


@pytest.mark.parametrize("phrase", UNBUILT_FEATURE_PHRASES)
def test_US_homepage_8_4_no_unbuilt_features_promised(home_html, phrase):
    """US-homepage-8.4 (story US-homepage-8): rendered HTML of / has no collaboration promise."""
    assert phrase.lower() not in home_html, f"/ promises an unbuilt feature: {phrase!r}"

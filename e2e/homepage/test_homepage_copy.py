"""E2E tests for the copy pinned by task H0 (docs/tasks/homepage/00-pin-copy-from-decisions.md).

Covers US-homepage-8.4 of docs/features/homepage.md. Other homepage scenarios
belong to task 12 (e2e-homepage). Public session, no cookies.
"""
import pytest

# Collaboration-sensitive strings from spec Conflict 1. A Memory has one owner
# and no contributor or invite feature exists, so the page must not promise it.
UNBUILT_FEATURE_PHRASES = ["add to", "Invite people", "just added a photo", "12 cousins"]


@pytest.mark.parametrize("phrase", UNBUILT_FEATURE_PHRASES)
def test_US_homepage_8_4_no_unbuilt_features_promised(api, phrase):
    """US-homepage-8.4 (story US-homepage-8): rendered HTML of / has no collaboration promise."""
    r = api.get("/")
    assert r.status == 200
    assert phrase.lower() not in r.text().lower(), f"/ promises an unbuilt feature: {phrase!r}"

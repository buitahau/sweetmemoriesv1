"""E2E_SEO_PROFILE: the server config a homepage-seo run declares (docs/tasks/homepage-seo/04-e2e-homepage-seo.md).

The server config cannot change during a run, so each run says what it expects. `only(...)` marks a test
that needs one of the given profiles: it skips with a reason under any other profile, and records the
profiles on the test function (`SEO_PROFILES_ATTR`) so the task 04 suite can check the skip matrix
against the task table without a server.
"""
import os

import pytest

PROFILES = ("dev", "prod-like", "unset-indexable", "bad-url", "path-url")
SEO_PROFILES_ATTR = "seo_profiles"


def current_profile(environ=None):
    value = (os.environ if environ is None else environ).get("E2E_SEO_PROFILE", "dev")
    if value not in PROFILES:
        raise RuntimeError(f"E2E_SEO_PROFILE must be one of {sorted(PROFILES)}, got {value!r}")
    return value


PROFILE = current_profile()


def only(*profiles, active=None):
    """Run the decorated test only under the given profiles; skip it with the reason otherwise."""
    unknown = [p for p in profiles if p not in PROFILES]
    if not profiles or unknown:
        raise ValueError(f"only() needs known profiles, got {profiles}")
    active = PROFILE if active is None else active

    def mark(fn):
        setattr(fn, SEO_PROFILES_ATTR, tuple(profiles))
        return pytest.mark.skipif(
            active not in profiles,
            reason=f"profile {active!r}; this scenario needs E2E_SEO_PROFILE in {profiles}",
        )(fn)

    return mark

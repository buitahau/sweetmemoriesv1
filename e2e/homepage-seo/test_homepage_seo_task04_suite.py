"""Checks on the homepage-seo e2e suite itself (task 04, docs/tasks/homepage-seo/04-e2e-homepage-seo.md).

The scenarios live in the task 02 and 03 files; this file checks, without a server, that the suite
matches the task: every US-homepage-seo-1 to 5 scenario of the feature spec has a test named after its
ID, the profile-only scenarios are exactly the ones in the task checklist (so the skip list of each
run matches the table and every scenario runs in at least one profile), 3.6 runs in every profile,
and e2e/README.md documents the profiles and commands.
"""
import importlib.util
import re

import pytest

from helpers import ROOT
from seo_profile import PROFILES, SEO_PROFILES_ATTR, current_profile, only

SUITE = ROOT / "e2e" / "homepage-seo"
SPEC = ROOT / "docs" / "features" / "homepage-seo.md"
TASK = ROOT / "docs" / "tasks" / "homepage-seo" / "04-e2e-homepage-seo.md"
README = ROOT / "e2e" / "README.md"
TASK_PROFILES = ("dev", "prod-like", "unset-indexable", "bad-url")
# path-url is an extra profile (not in the task table) that also runs 3.4, for the "path reduced to origin" half.
EXTRA = {"3.4": {"path-url"}}
TEST_ID = re.compile(r"^test_US_homepage_seo_(\d+)_(\d+)_")


def _spec_scenarios():
    """Scenario IDs ("1.1", ...) of US-homepage-seo-1 to 5, read from the numbered list under each story."""
    ids, story = [], None
    for line in SPEC.read_text().splitlines():
        m = re.match(r"\*\*US-homepage-seo-(\d+):", line)
        if m:
            story = m.group(1)
            continue
        if line.startswith("## ") or line.startswith("# "):
            story = None
        m = re.match(r"\s+(\d+)\.\s+\*", line)
        if story and m:
            ids.append(f"{story}.{m.group(1)}")
    return ids


def _task_matrix():
    """{profile: {scenario IDs}} from the task checklist line "`prod-like` runs US-2.1, 2.2 ... and 5.1; ..."."""
    text = TASK.read_text()
    line = next(l for l in text.splitlines() if "skip with a reason" in l)
    matrix = {}
    for profile, ids in re.findall(r"`([a-z-]+)` runs (?:US-)?([\d.,\s]+(?:and [\d.]+)?)", line):
        matrix[profile] = set(re.findall(r"\d+\.\d+", ids))
    return matrix


def _suite_tests():
    """{test name: profiles tuple or None} for every test in the homepage-seo suite files."""
    tests = {}
    for path in sorted(SUITE.glob("test_homepage_seo_task*.py")):
        if path.name == __file__.rsplit("/", 1)[-1]:
            continue
        spec = importlib.util.spec_from_file_location(f"_seo_suite_{path.stem}", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for name, obj in vars(module).items():
            if name.startswith("test_") and callable(obj):
                tests[name] = getattr(obj, SEO_PROFILES_ATTR, None)
    return tests


def _scenario_tests():
    """{scenario ID: [(test name, profiles)]} for tests named test_US_homepage_seo_<story>_<n>_..."""
    out = {}
    for name, profiles in _suite_tests().items():
        m = TEST_ID.match(name)
        if m:
            out.setdefault(f"{m.group(1)}.{m.group(2)}", []).append((name, profiles))
    return out


def _runs_in(profiles, profile):
    return profiles is None or profile in profiles


# --- Verification: each scenario ID appears in a test name ------------------------------------------


def test_T04_V3_every_spec_scenario_has_a_test_named_after_its_id():
    """T04-V3: each US-homepage-seo-1.1 to 5.2 scenario of the spec has exactly one test named after its ID."""
    spec_ids = _spec_scenarios()
    assert len(spec_ids) == 20, f"spec scenario list changed: {spec_ids}"
    tests = _scenario_tests()
    assert sorted(set(spec_ids) - set(tests)) == [], "scenarios without a test"
    assert sorted(set(tests) - set(spec_ids)) == [], "tests named after a scenario that is not in the spec"
    duplicates = {sid: names for sid, names in tests.items() if len(names) > 1}
    assert duplicates == {}, f"more than one test per scenario: {duplicates}"


# --- Checklist: profile-specific scenarios ----------------------------------------------------------


def test_T04_C1_task_matrix_is_parsed_from_the_task_checklist():
    """T04-C1 (precondition): the checklist names a scenario list for each of the four task profiles."""
    matrix = _task_matrix()
    assert set(matrix) == set(TASK_PROFILES), matrix
    assert matrix["prod-like"] == {"2.1", "2.2", "3.1", "3.5", "5.1"}
    assert matrix["dev"] == {"2.4", "3.2"}
    assert matrix["unset-indexable"] == {"3.3"}
    assert matrix["bad-url"] == {"3.4"}


def test_T04_C1_profile_only_scenarios_match_the_task_table():
    """T04-C1: profile-only scenarios are exactly those of the task (plus path-url for 3.4); all others
    carry no profile and so run in every profile."""
    expected = {}
    for profile, ids in _task_matrix().items():
        for sid in ids:
            expected.setdefault(sid, set()).add(profile)
    for sid, extra in EXTRA.items():
        expected[sid] |= extra
    actual = {}
    for sid, [(name, profiles)] in _scenario_tests().items():
        if profiles is not None:
            actual[sid] = set(profiles)
    assert actual == expected


@pytest.mark.parametrize("profile", TASK_PROFILES + ("path-url",))
def test_T04_V2_skip_list_per_profile_matches_the_table(profile):
    """T04-V2: under each profile, the skipped scenarios are exactly the ones the table gives to other profiles."""
    matrix = _task_matrix()
    gated = {sid for ids in matrix.values() for sid in ids} | set(EXTRA)
    owned = set(matrix.get(profile, set())) | {sid for sid, extra in EXTRA.items() if profile in extra}
    expected_skips = gated - owned
    skips = {sid for sid, [(_, profiles)] in _scenario_tests().items() if not _runs_in(profiles, profile)}
    assert skips == expected_skips


def test_T04_V2_every_scenario_runs_in_at_least_one_task_profile():
    """T04-V2: no scenario is skipped in all four task profiles."""
    never = [sid for sid, [(_, profiles)] in _scenario_tests().items()
             if not any(_runs_in(profiles, p) for p in TASK_PROFILES)]
    assert never == []


def test_T04_C3_hydration_scenario_runs_in_every_profile():
    """T04-C3: US-homepage-seo-3.6 carries no profile restriction."""
    [(name, profiles)] = _scenario_tests()["3.6"]
    assert name == "test_US_homepage_seo_3_6_head_unchanged_after_hydration"
    assert profiles is None


def test_T04_C1_non_scenario_live_checks_that_assume_dev_values_are_dev_only():
    """T04-C1: the task 01 live check of dev values (noindex and own canonical) skips outside `dev`, so
    other profiles do not fail on it."""
    assert _suite_tests()["test_T01_V3c_home_head_uses_site_url_and_noindex"] == ("dev",)


# --- Profile helper ---------------------------------------------------------------------------------


def test_T04_profile_defaults_to_dev_and_rejects_unknown_values():
    """The profile defaults to `dev`, accepts every documented profile and fails the run on a typo."""
    assert current_profile({}) == "dev"
    for p in PROFILES:
        assert current_profile({"E2E_SEO_PROFILE": p}) == p
    with pytest.raises(RuntimeError, match="E2E_SEO_PROFILE must be one of"):
        current_profile({"E2E_SEO_PROFILE": "prod"})
    with pytest.raises(RuntimeError):
        current_profile({"E2E_SEO_PROFILE": ""})


def test_T04_only_skips_with_a_reason_outside_its_profiles():
    """only() records the profiles and adds a skip mark whose condition and reason name the active profile."""

    def probe():
        pass

    marked = only("prod-like", active="dev")(probe)
    assert getattr(marked, SEO_PROFILES_ATTR) == ("prod-like",)
    [mark] = [m for m in marked.pytestmark if m.name == "skipif"]
    assert mark.args == (True,)
    assert "profile 'dev'" in mark.kwargs["reason"] and "prod-like" in mark.kwargs["reason"]

    def probe2():
        pass

    runs = only("bad-url", "path-url", active="path-url")(probe2)
    [mark] = [m for m in runs.pytestmark if m.name == "skipif"]
    assert mark.args == (False,)


@pytest.mark.parametrize("profiles", [(), ("prod",), ("dev", "staging")])
def test_T04_only_rejects_unknown_or_missing_profiles(profiles):
    """only() refuses an empty or misspelt profile list instead of silently never running the test."""
    with pytest.raises(ValueError):
        only(*profiles)


# --- Checklist: README -------------------------------------------------------------------------------


def test_T04_C4_readme_documents_profiles_and_commands():
    """T04-C4: e2e/README.md names each task profile with its server config and the pytest command."""
    readme = README.read_text()
    section = readme[readme.index("`e2e/homepage-seo`"):]
    for profile in TASK_PROFILES:
        assert f"`{profile}`" in section, f"profile {profile} not documented"
    for command in ("E2E_SEO_PROFILE=prod-like", "E2E_SEO_PROFILE=unset-indexable", "E2E_SEO_PROFILE=bad-url",
                    "pytest e2e/homepage-seo -rs"):
        assert command in section, f"command {command!r} not documented"
    for config in ("SITE_URL=https://sweetmemories.com", "SITE_INDEXABLE=true", "SITE_URL=not-a-url",
                   "Host: evil.example"):
        assert config in section, f"{config!r} not documented"
    assert "comes with task 04" not in section, "stale note: the per-scenario suite has landed"

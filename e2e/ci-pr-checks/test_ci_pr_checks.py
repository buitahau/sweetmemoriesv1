"""E2E tests for docs/features/ci-pr-checks.md (US-ci-1, US-ci-2, US-ci-3).

One test per Given/When/Then scenario. Live checks are read-only (gh run list,
gh api); scenarios that would need this suite to push or open a PR are BLOCKED
(skipped with the reason); see the report.
"""
import json
import pathlib
import re
import shutil
import tempfile
import uuid

import pytest

from helpers import ROOT, run

BLOCKED_NO_PR = "BLOCKED: needs this suite to push or open a PR on GitHub, which it must not do"


def _steps(workflow):
    return workflow["jobs"]["ci"]["steps"]


def _runs(workflow):
    return [s["run"] for s in _steps(workflow) if "run" in s]


# ---------- US-ci-1: Checks run on every PR ----------

def test_US_ci_1_1_check_named_ci_runs_on_pr_to_dev_v2(workflow):
    """US-ci-1.1 (story US-ci-1): a PR into dev-v2 triggers a job named `ci`.

    The live "starts within 1 minute / All checks have passed" part needs a PR
    run on GitHub and is not asserted here.
    """
    # PyYAML parses the key `on` as boolean True.
    trigger = workflow.get("on", workflow.get(True))
    assert "dev-v2" in trigger["pull_request"]["branches"]
    assert "main" in trigger["pull_request"]["branches"]
    assert workflow["jobs"]["ci"]["name"] == "ci"


def _dev_v2_pr_head_shas():
    """Head SHAs of every PR (open or merged) whose base is dev-v2, from one gh call."""
    r = run(["gh", "pr", "list", "--base", "dev-v2", "--state", "all", "--limit", "100",
             "--json", "number,headRefOid"])
    assert r.returncode == 0, f"gh pr list failed: {r.stderr.strip()}"
    return {pr["headRefOid"] for pr in json.loads(r.stdout)}


def test_US_ci_1_1b_live_ci_run_succeeds_within_a_minute():
    """US-ci-1.1 live part: check starts within 1 minute and ends success.

    Read-only: inspects the most recent completed `ci` pull_request run whose
    base is dev-v2 (PR may be open or merged) via `gh run list`; nothing is
    pushed. Limitation: startedAt - createdAt is the queue delay of the run,
    not the gap from push/PR-open to run creation, so it is weak evidence of
    the "within 1 minute" criterion; the conclusion check is the main signal.
    """
    from datetime import datetime

    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh not installed")
    r = run(["gh", "run", "list", "--workflow", "ci", "--event", "pull_request",
             "--status", "completed", "--limit", "20",
             "--json", "conclusion,createdAt,startedAt,headSha,event"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run list failed: {r.stderr.strip()}")
    runs = json.loads(r.stdout)
    # Pin to PRs into dev-v2: match each run's head SHA against the PR list (one gh call).
    shas = _dev_v2_pr_head_shas()
    runs = [x for x in runs if x["headSha"] in shas]
    if not runs:
        pytest.skip("BLOCKED: no completed ci pull_request run for a PR into dev-v2 yet")

    def ts(v):
        return datetime.fromisoformat(v.replace("Z", "+00:00"))

    latest = max(runs, key=lambda x: ts(x["createdAt"]))
    assert latest["conclusion"] == "success", latest
    assert (ts(latest["startedAt"]) - ts(latest["createdAt"])).total_seconds() <= 60, latest


def test_US_ci_1_2_new_commit_reruns_ci(workflow):
    """US-ci-1.2 (story US-ci-1): pushing a new commit re-runs `ci` on the new head.

    pull_request defaults to opened/synchronize/reopened; `synchronize` is what
    a push triggers, so `types` must not be narrowed to exclude it.
    """
    trigger = workflow.get("on", workflow.get(True))["pull_request"]
    types = trigger.get("types")
    assert types is None or "synchronize" in types


def test_US_ci_1_3_lockfile_drift_fails_at_frozen_install():
    """US-ci-1.3 (story US-ci-1): package.json changed without the lockfile fails the frozen install."""
    if not shutil.which("pnpm"):
        pytest.skip("BLOCKED: pnpm not installed")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        for name in ("package.json", "pnpm-lock.yaml"):
            shutil.copy(ROOT / name, tmp / name)
        for extra in ("pnpm-workspace.yaml", ".npmrc"):
            if (ROOT / extra).exists():
                shutil.copy(ROOT / extra, tmp / extra)
        pkg = (tmp / "package.json").read_text()
        # Add a dependency without touching pnpm-lock.yaml.
        pkg = pkg.replace('"dependencies": {', '"dependencies": {\n    "e2e-lockfile-drift-pkg": "^1.0.0",', 1)
        (tmp / "package.json").write_text(pkg)
        r = run(["pnpm", "install", "--frozen-lockfile", "--ignore-scripts"], cwd=tmp, timeout=240)
    out = r.stdout + r.stderr
    assert r.returncode != 0
    assert re.search(r"frozen-lockfile|ERR_PNPM_OUTDATED_LOCKFILE", out), out


def test_US_ci_1_4_same_toolchain_node_24_and_pinned_pnpm(workflow, package_json):
    """US-ci-1.4 (story US-ci-1): ci logs Node 24.x and the pnpm pinned in package.json."""
    assert re.fullmatch(r"pnpm@\d+\.\d+\.\d+", package_json["packageManager"])
    assert package_json["engines"]["node"] == ">=24 <25"
    node = next(s for s in _steps(workflow) if "setup-node" in s.get("uses", ""))
    assert str(node["with"]["node-version"]) == "24"
    pnpm_step = next(s for s in _steps(workflow) if "pnpm/action-setup" in s.get("uses", ""))
    # No explicit version: action-setup reads packageManager from package.json.
    assert "version" not in (pnpm_step.get("with") or {})
    assert any("node --version" in r and "pnpm --version" in r for r in _runs(workflow))


# ---------- US-ci-2: A failing check blocks the merge ----------

def test_US_ci_2_1_failing_unit_test_is_reported_by_name(workflow):
    """US-ci-2.1 (story US-ci-2): a Vitest test asserting 1 === 2 fails `vitest run` and names the test.

    `ci` must run `pnpm test`. The failing test lives in a temp dir and runs
    through the project's vite.config.ts (include overridden by a temp config),
    so nothing is written to the repo. The "merge button disabled" part is
    covered by the branch protection cases.
    """
    assert "pnpm test" in _runs(workflow)
    name = f"e2e-failing-{uuid.uuid4().hex[:8]}"
    with tempfile.TemporaryDirectory() as tmp:
        (pathlib.Path(tmp) / f"{name}.test.ts").write_text(
            f"it('{name}', () => {{ expect(1).toBe(2) }})\n"
        )
        base = (ROOT / "vite.config.ts").as_posix()
        (pathlib.Path(tmp) / "vitest.e2e.config.mjs").write_text(
            f"import base from '{base}'\n"
            f"export default {{ ...base, test: {{ ...base.test, include: ['{pathlib.Path(tmp).as_posix()}/*.test.ts'] }} }}\n"
        )
        r = run(["pnpm", "exec", "vitest", "run", "--config", str(pathlib.Path(tmp) / "vitest.e2e.config.mjs"),
                 "--root", str(ROOT), "--globals", "--allowOnly=false"])
    assert r.returncode != 0
    assert name in r.stdout + r.stderr


def test_US_ci_2_2_type_error_fails_typecheck_and_ci_runs_it(workflow):
    """US-ci-2.2 (story US-ci-2): a TypeScript type error fails the typecheck step of `ci`.

    The bad file and a tsconfig extending the root one live in a temp dir.
    """
    runs = _runs(workflow)
    for cmd in ("pnpm test", "pnpm typecheck", "pnpm lint", "pnpm build"):
        assert cmd in runs, f"ci does not run {cmd}"
    # No step may swallow a failure.
    for s in _steps(workflow):
        assert not s.get("continue-on-error")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        (tmp / "bad.ts").write_text("export const n: number = 'not a number'\n")
        (tmp / "tsconfig.json").write_text(json.dumps({
            "extends": str(ROOT / "tsconfig.json"),
            "compilerOptions": {"types": []},
            "include": ["bad.ts"],
        }))
        r = run(["pnpm", "exec", "tsc", "-p", str(tmp / "tsconfig.json")])
    assert r.returncode != 0
    assert "TS2322" in r.stdout + r.stderr


def test_US_ci_2_3_pending_check_blocks_merge_until_green(protection):
    """US-ci-2.3 (story US-ci-2): `ci` is a required status, so a pending run blocks the merge."""
    branch, protection = protection
    assert protection is not None, f"{branch} has no branch protection"
    rsc = protection.get("required_status_checks") or {}
    contexts = set(rsc.get("contexts", [])) | {c["context"] for c in rsc.get("checks", [])}
    assert "ci" in contexts, f"{branch} does not require the `ci` check (found {sorted(contexts)})"


def test_US_ci_2_4_no_bypass_for_admins(protection):
    """US-ci-2.4 (story US-ci-2): branch protection applies to admins (no `--admin` bypass)."""
    branch, protection = protection
    assert protection is not None, f"{branch} has no branch protection"
    assert protection["enforce_admins"]["enabled"] is True
    rsc = protection.get("required_status_checks") or {}
    contexts = set(rsc.get("contexts", [])) | {c["context"] for c in rsc.get("checks", [])}
    assert "ci" in contexts, "enforce_admins is on but `ci` is not required, so there is nothing to enforce"


def test_branch_protection_script_check_passes():
    """Feature criterion: `scripts/ci-branch-protection.sh check` exits 0 (dev-v2, main, squash-only)."""
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    r = run(["bash", "scripts/ci-branch-protection.sh", "check"])
    assert r.returncode == 0, r.stdout + r.stderr


def test_US_ci_2_5_direct_push_blocked(protection):
    """US-ci-2.5 (story US-ci-2): direct pushes to dev-v2 are rejected.

    Asserted from the protection settings (the suite never attempts a real
    push): a PR must be required, and admins and force pushes are locked down.
    Required status checks alone are not enough, since a direct push of an
    already-green commit could still be accepted.
    """
    branch, protection = protection
    assert protection is not None, f"{branch} has no branch protection"
    assert protection["enforce_admins"]["enabled"] is True
    assert protection["allow_force_pushes"]["enabled"] is False
    assert protection.get("required_pull_request_reviews"), f"{branch} does not require a pull request: direct push is not blocked"


def test_US_ci_2_6_out_of_date_branch_must_be_updated(protection):
    """US-ci-2.6 (story US-ci-2): a branch behind dev-v2 must be updated and re-checked."""
    branch, protection = protection
    assert protection is not None, f"{branch} has no branch protection"
    rsc = protection.get("required_status_checks") or {}
    assert rsc.get("strict") is True, f"`Require branches to be up to date` is off on {branch}"


# ---------- US-ci-3: PR checks never expose secrets ----------

def test_US_ci_3_1_no_secrets_reachable_by_pr_runs(workflow, workflow_text):
    """US-ci-3.1 (story US-ci-3): the workflow never references deploy or database secrets."""
    assert "secrets." not in workflow_text
    for name in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "DATABASE_URL"):
        assert name not in workflow_text


def test_US_ci_3_2_fork_pr_read_only_no_secrets(workflow, workflow_text):
    """US-ci-3.2 (story US-ci-3): fork PRs run read-only with no secrets.

    Plain `pull_request` (never `pull_request_target`) gives fork PRs a read-only
    token and no secrets; permissions are pinned to contents: read.
    """
    trigger = workflow.get("on", workflow.get(True))
    assert list(trigger) == ["pull_request"]
    assert "pull_request_target" not in workflow_text
    assert workflow["permissions"] == {"contents": "read"}
    checkout = next(s for s in _steps(workflow) if "actions/checkout" in s.get("uses", ""))
    assert checkout["with"]["persist-credentials"] is False


def test_US_ci_3_3_pr_does_not_deploy(workflow):
    """US-ci-3.3 (story US-ci-3): the PR workflow has no deploy step.

    Checks step `uses`/`run` only (comments may mention deploy). The live "dev
    environment still serves the previous commit" part needs a PR run.
    """
    for s in _steps(workflow):
        text = (s.get("uses", "") + " " + s.get("run", "")).lower()
        for word in ("wrangler", "deploy", "cloudflare"):
            assert word not in text, f"step {s.get('name')!r} looks like a deploy step"


def test_US_ci_3_3b_live_dev_environment_unchanged_after_pr():
    """US-ci-3.3 live part: dev environment keeps serving the previous dev-v2 commit."""
    pytest.skip("BLOCKED: no dev environment exists yet (dev-deploy is out of scope) and it needs a real PR run")

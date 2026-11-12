"""E2E tests for docs/features/dev-deploy.md (US-deploy-1 .. US-deploy-4).

One test per Given/When/Then scenario. Deployed-app scenarios hit E2E_BASE_URL
(local Worker by default, the dev URL for a tester). Pipeline scenarios are
checked on the committed workflow, the real smoke script and read-only gh output;
scenarios needing a merge, a broken deploy or the Cloudflare dashboard are BLOCKED.
"""
import http.server
import json
import os
import re
import shutil
import sys
import threading
from datetime import datetime

import pytest
from playwright.sync_api import expect

from helpers import ROOT, run

def _ts(v):
    return datetime.fromisoformat(v.replace("Z", "+00:00"))


def _jobs(run_id):
    """Jobs of a run via read-only gh, or skip."""
    r = run(["gh", "run", "view", str(run_id), "--json", "jobs"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run view failed: {r.stderr.strip()[:200]}")
    return json.loads(r.stdout)["jobs"]


HEADING = "SweetMemories home page"
DOCS = ROOT / "docs" / "infra" / "dev-environment.md"
BLOCKED_MERGE = "BLOCKED: needs a real merge into dev-v2 (this suite must not push or merge)"
BLOCKED_BROKEN = "BLOCKED: needs a deliberately broken deploy on the shared dev Worker"
BLOCKED_CF = "BLOCKED: needs the Cloudflare dashboard, which this suite cannot read"


def _steps(workflow):
    return workflow["jobs"]["deploy"]["steps"]


def _step_index(workflow, pred):
    for i, s in enumerate(_steps(workflow)):
        if pred(s):
            return i
    raise AssertionError("step not found")


def _run_idx(workflow, cmd):
    return _step_index(workflow, lambda s: s.get("run", "").strip() == cmd)


def _trigger(workflow):
    return workflow.get("on", workflow.get(True))  # PyYAML parses `on` as True


# ---------- US-deploy-1: Merge deploys to dev automatically ----------

def test_US_deploy_1_1_merge_into_dev_v2_triggers_deploy_dev(workflow):
    """US-deploy-1.1 (story US-deploy-1): static part, a push to dev-v2 starts the deploy-dev job."""
    assert _trigger(workflow)["push"]["branches"] == ["dev-v2"]
    assert workflow["jobs"]["deploy"]["name"] == "deploy-dev"


@pytest.mark.xfail(strict=True, reason="SPEC GAP: spec promises success within 10 minutes but "
                   "deploy-dev.yml caps the job at timeout-minutes: 15")
def test_US_deploy_1_1c_job_timeout_matches_spec_ten_minutes(workflow):
    """US-deploy-1.1 (story US-deploy-1): the job cap must not exceed the spec's 10 minutes."""
    assert workflow["jobs"]["deploy"]["timeout-minutes"] <= 10


def test_US_deploy_1_1b_live_push_run_succeeded_within_ten_minutes(deploy_runs):
    """US-deploy-1.1 live part: the latest completed push run on dev-v2 succeeded within 10 minutes."""
    pushes = [r for r in deploy_runs if r["event"] == "push" and r["status"] == "completed"]
    if not pushes:
        pytest.skip(BLOCKED_MERGE)
    latest = pushes[0]
    assert latest["headBranch"] == "dev-v2"
    assert (_ts(latest["updatedAt"]) - _ts(latest["createdAt"])).total_seconds() <= 600
    assert latest["conclusion"] == "success"


def test_US_deploy_1_2_dev_home_page_live(page, base_url, shot):
    """US-deploy-1.2 (story US-deploy-1): `/` with no cookies returns 200 and shows the heading."""
    resp = page.goto(base_url + "/")
    page.wait_for_load_state("networkidle")
    shot(page, "US-deploy-1.2-home")
    assert resp.status == 200
    expect(page.get_by_role("heading", level=1, name=HEADING)).to_be_visible()


def test_US_deploy_1_3_dev_health(api):
    """US-deploy-1.3 (story US-deploy-1): /api/health is 200 JSON, exact body, no-store, no Set-Cookie."""
    r = api.get("/api/health")
    assert r.status == 200
    assert r.headers["content-type"].startswith("application/json")
    assert r.text() == '{"status":"ok"}'
    assert "no-store" in r.headers.get("cache-control", "")
    assert "set-cookie" not in r.headers


def test_US_deploy_1_4_existing_skeleton_e2e_passes_on_target(base_url):
    """US-deploy-1.4 (story US-deploy-1): project-skeleton e2e passes with E2E_BASE_URL, except 1.6."""
    env = dict(os.environ, E2E_BASE_URL=base_url)
    r = run([sys.executable, "-m", "pytest", "e2e/project-skeleton", "-q", "-p", "no:cacheprovider",
             "--deselect", "e2e/project-skeleton/test_project_skeleton.py::test_US_skeleton_1_6_health_server_down"],
            env=env, timeout=600)
    assert r.returncode == 0, r.stdout[-2000:] + r.stderr[-500:]


def test_US_deploy_1_5_run_summary_shows_sha_url_version(workflow):
    """US-deploy-1.5 (story US-deploy-1): run summary lists commit SHA, dev URL, Cloudflare version ID."""
    summary = next(s for s in _steps(workflow) if s.get("name") == "Job summary")
    script = summary["run"]
    assert "GITHUB_STEP_SUMMARY" in script
    assert "Commit:" in script and "$SHA" in script
    assert "Dev URL:" in script and "$DEV_URL" in script
    assert "Cloudflare version ID:" in script
    # Summary is written last, after the smoke check and rollback.
    assert _steps(workflow)[-1] is summary


def test_US_deploy_1_5b_live_summary_has_sha(deploy_runs):
    """US-deploy-1.5 live part: the latest successful push run's summary shows its SHA and dev URL."""
    ok = [r for r in deploy_runs if r["conclusion"] == "success" and r["event"] == "push"]
    if not ok:
        pytest.skip(BLOCKED_MERGE)
    r = run(["gh", "run", "view", str(ok[0]["databaseId"]), "--log"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh run view failed: {r.stderr.strip()[:200]}")
    assert ok[0]["headSha"] in r.stdout
    assert re.search(r"Cloudflare version ID", r.stdout) or "Current Version ID" in r.stdout


def test_US_deploy_1_6_unknown_path_not_found(page, base_url, shot):
    """US-deploy-1.6 (story US-deploy-1): /does-not-exist is 404 with "Page not found"."""
    resp = page.goto(base_url + "/does-not-exist")
    page.wait_for_load_state("networkidle")
    shot(page, "US-deploy-1.6-not-found")
    assert resp.status == 404
    expect(page.get_by_text("Page not found")).to_be_visible()


# ---------- US-deploy-2: Failed builds or tests never reach dev ----------

def test_US_deploy_2_1_failing_checks_stop_before_deploy(workflow):
    """US-deploy-2.1 (story US-deploy-2): lint/typecheck/test/build run before deploy and none can be skipped on failure."""
    deploy = _step_index(workflow, lambda s: s.get("id") == "deploy")
    for cmd in ["pnpm lint", "pnpm typecheck", "pnpm test", "pnpm build"]:
        assert _run_idx(workflow, cmd) < deploy, f"{cmd} must run before the deploy step"
    for s in _steps(workflow)[:deploy]:
        assert "continue-on-error" not in s, f"{s} must not swallow failures"
        assert "if" not in s or "always()" not in str(s["if"])


def test_US_deploy_2_2_deploy_failure_fails_run(workflow):
    """US-deploy-2.2 (story US-deploy-2): a failing `wrangler deploy` fails the run (no continue-on-error), later steps depend on it."""
    deploy = next(s for s in _steps(workflow) if s.get("id") == "deploy")
    assert "continue-on-error" not in deploy
    assert "deploy -c wrangler.jsonc --env dev" in deploy["with"]["command"]
    smoke = next(s for s in _steps(workflow) if s.get("id") == "smoke")
    assert "if" not in smoke  # default success() gate: skipped when deploy failed
    pytest.skip(BLOCKED_BROKEN + " (live part: red status and old version still served)")


def _serve(handler_cls):
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler_cls)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


class _Bad(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'{"error":"nope"}')

    def log_message(self, *a):
        pass


class _Good(http.server.BaseHTTPRequestHandler):
    cookie = False

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        if self.cookie:
            self.send_header("Set-Cookie", "a=b")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def log_message(self, *a):
        pass


class _GoodCookie(_Good):
    cookie = True


def _smoke(url):
    env = dict(os.environ, SMOKE_TIMEOUT_MS="1000")  # fail fast instead of the default 60s poll
    return run(["node", "src/ci/smoke-health.ts", url], timeout=120, env=env)


def test_US_deploy_2_3_smoke_check_fails_with_response_in_log():
    """US-deploy-2.3 (story US-deploy-2): a non-200 /api/health fails the smoke step and logs status and body."""
    srv = _serve(_Bad)
    try:
        r = _smoke(f"http://127.0.0.1:{srv.server_address[1]}")
    finally:
        srv.shutdown()
    assert r.returncode == 1
    out = r.stdout + r.stderr
    # The smoke script prints the body JSON-escaped, so match the inner text.
    assert "status=404" in out and "nope" in out


class _WrongBody(_Good):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"down"}')


def test_US_deploy_2_3d_smoke_check_fails_on_200_with_wrong_body():
    """US-deploy-2.3 (story US-deploy-2): a 200 whose body is not {"status":"ok"} fails the smoke step."""
    srv = _serve(_WrongBody)
    try:
        r = _smoke(f"http://127.0.0.1:{srv.server_address[1]}")
    finally:
        srv.shutdown()
    assert r.returncode == 1
    assert "unexpected response body" in r.stdout + r.stderr


def test_US_deploy_2_3b_smoke_check_passes_on_healthy_app():
    """US-deploy-2.3 (story US-deploy-2): exact 200 {"status":"ok"} without cookies passes the smoke step."""
    srv = _serve(_Good)
    try:
        r = _smoke(f"http://127.0.0.1:{srv.server_address[1]}")
    finally:
        srv.shutdown()
    assert r.returncode == 0, r.stdout + r.stderr


def test_US_deploy_2_3c_smoke_step_wired_with_rollback(workflow):
    """US-deploy-2.3 (story US-deploy-2): smoke runs after deploy; failed smoke triggers rollback."""
    deploy = _step_index(workflow, lambda s: s.get("id") == "deploy")
    smoke = _step_index(workflow, lambda s: s.get("id") == "smoke")
    rb = _step_index(workflow, lambda s: s.get("id") == "rollback")
    assert deploy < smoke < rb
    assert "smoke-health.ts" in _steps(workflow)[smoke]["run"]
    assert "rollback" in _steps(workflow)[rb]["with"]["command"]
    assert "smoke.outcome == 'failure'" in _steps(workflow)[rb]["if"]


def test_US_deploy_2_4_manual_rollback_documented():
    """US-deploy-2.4 (story US-deploy-2): rollback steps exist in dev-environment.md. Static, runs anywhere."""
    text = DOCS.read_text()
    assert "## Manual rollback" in text
    assert "wrangler rollback" in text and "--env dev" in text
    assert "/api/health" in text


def test_US_deploy_2_4b_health_ok_after_rollback(base_url, api):
    """US-deploy-2.4 live part: dev health is 200. The actual rollback of the shared dev Worker is not run here."""
    assert api.get("/api/health").status == 200
    pytest.skip(BLOCKED_BROKEN + " (live part: rollback and previous version served)")


# ---------- US-deploy-3: Merges in quick succession deploy in order ----------

def test_US_deploy_3_1_runs_are_serialised(workflow):
    """US-deploy-3.1 (story US-deploy-3): concurrency group serialises runs and never cancels a running deploy."""
    conc = workflow["concurrency"]
    assert conc["group"] == "deploy-dev"
    assert conc["cancel-in-progress"] is False


def test_US_deploy_3_1b_live_runs_did_not_overlap(deploy_runs):
    """US-deploy-3.1 live part: deploy jobs of successful runs never overlap and dev serves the dev-v2 head."""
    done = [r for r in deploy_runs if r["status"] == "completed" and r["conclusion"] == "success"]
    if len(done) < 2:
        pytest.skip("BLOCKED: needs two successful deploy-dev runs (two quick merges)")
    windows = []
    for r in done:
        job = next((j for j in _jobs(r["databaseId"]) if j["name"] == "deploy-dev"), None)
        assert job and job.get("startedAt") and job.get("completedAt")
        windows.append((_ts(job["startedAt"]), _ts(job["completedAt"])))
    windows.sort()
    for prev, cur in zip(windows, windows[1:]):
        assert cur[0] >= prev[1], f"deploy job started {cur[0]} before the previous ended {prev[1]}"
    pushes = [r for r in done if r["event"] == "push"]
    if pushes:
        head = run(["gh", "api", "repos/{owner}/{repo}/commits/dev-v2", "--jq", ".sha"])
        if head.returncode != 0:
            pytest.skip(f"BLOCKED: gh api failed: {head.stderr.strip()[:200]}")
        assert pushes[0]["headSha"] == head.stdout.strip()


def test_US_deploy_3_2_manual_rerun_and_stale_guard(workflow):
    """US-deploy-3.2 (story US-deploy-3): workflow_dispatch exists, only dev-v2 may deploy, stale runs are refused before deploy."""
    assert "workflow_dispatch" in _trigger(workflow)
    assert workflow["jobs"]["deploy"]["if"] == "github.ref == 'refs/heads/dev-v2'"
    stale = _step_index(workflow, lambda s: s.get("name") == "Refuse stale run")
    deploy = _step_index(workflow, lambda s: s.get("id") == "deploy")
    assert stale < deploy
    script = _steps(workflow)[stale]["run"]
    assert "stale run" in script and "exit 1" in script and "dev-v2" in script


# ---------- US-deploy-4: Deploy credentials and dev stay safe ----------

def test_US_deploy_4_1_secrets_never_echoed(workflow):
    """US-deploy-4.1 (story US-deploy-4): secrets only appear as wrangler-action inputs, never in run scripts."""
    for s in _steps(workflow):
        assert "secrets." not in s.get("run", ""), f"secret used in a run script: {s.get('name')}"
        assert "DATABASE_URL" not in s.get("run", "")
        for k, v in (s.get("env") or {}).items():
            assert "secrets." not in str(v), f"secret exposed as env {k}"
    assert workflow["jobs"]["deploy"]["environment"] == "dev"


def test_US_deploy_4_1b_live_log_has_no_secret_names(deploy_runs):
    """US-deploy-4.1 live part (best effort): the newest run that ran 'Deploy to dev' has no DB URL with credentials and no `CLOUDFLARE_API_TOKEN=<token>`.

    A raw token printed without that label would not be caught; GitHub masking covers that.
    """
    for dr in deploy_runs:
        ran = any(
            j["name"] == "deploy-dev" and any(s["name"] == "Deploy to dev" and s.get("conclusion") not in (None, "skipped")
                                              for s in j.get("steps", []))
            for j in _jobs(dr["databaseId"])
        )
        if not ran:
            continue
        r = run(["gh", "run", "view", str(dr["databaseId"]), "--log"])
        if r.returncode != 0 or not r.stdout.strip():
            continue
        assert not re.search(r"postgres(ql)?://\S+:\S+@", r.stdout)
        assert not re.search(r"CLOUDFLARE_API_TOKEN[=:]\s*[A-Za-z0-9_-]{30,}", r.stdout)
        return
    pytest.skip("BLOCKED: no dev-v2 run has executed the 'Deploy to dev' step with a readable log yet")


def test_US_deploy_4_2_only_dev_v2_deploys(workflow):
    """US-deploy-4.2 (story US-deploy-4): push trigger is dev-v2 only and the job refuses any other ref."""
    assert _trigger(workflow)["push"]["branches"] == ["dev-v2"]
    assert "refs/heads/dev-v2" in workflow["jobs"]["deploy"]["if"]
    assert "pull_request" not in _trigger(workflow)
    assert "pull_request_target" not in _trigger(workflow)


def test_US_deploy_4_2c_environment_allows_only_dev_v2():
    """US-deploy-4.2 / Task 02: the GitHub Environment `dev` allows custom branch policies and lists dev-v2 only."""
    if not shutil.which("gh"):
        pytest.skip("BLOCKED: gh CLI not installed")
    env = run(["gh", "api", "repos/{owner}/{repo}/environments/dev", "--jq", ".deployment_branch_policy"])
    if env.returncode != 0:
        pytest.skip(f"BLOCKED: gh api failed (missing or unauthorized): {env.stderr.strip()[:200]}")
    assert json.loads(env.stdout) == {"custom_branch_policies": True, "protected_branches": False}, \
        "Environment dev must use custom branch policies (not 'All branches' or 'Protected branches')"
    r = run(["gh", "api", "repos/{owner}/{repo}/environments/dev/deployment-branch-policies",
             "--jq", "[.branch_policies[].name]"])
    if r.returncode != 0:
        pytest.skip(f"BLOCKED: gh api failed (missing or unauthorized): {r.stderr.strip()[:200]}")
    assert sorted(json.loads(r.stdout)) == ["dev-v2"]


def test_US_deploy_4_2b_live_no_deploy_step_ran_off_dev_v2(off_branch_runs):
    """US-deploy-4.2 live part: on v2 deploy-dev runs from a branch other than dev-v2 the 'Deploy to dev' step never ran."""
    if not off_branch_runs:
        pytest.skip("BLOCKED: no deploy-dev run from another branch exists (needs a workflow_dispatch from one)")
    inspected = 0
    for r in off_branch_runs:
        for job in _jobs(r["databaseId"]):
            if job["name"] != "deploy-dev":
                continue  # a v1 workflow run that shares the file name
            inspected += 1
            for step in job.get("steps", []):
                if step["name"] == "Deploy to dev":
                    assert step["conclusion"] in ("skipped", None), f"deploy ran on {r['headBranch']}"
    if inspected == 0:
        pytest.skip("BLOCKED: no v2 deploy-dev job from another branch exists (only v1 runs found)")


def test_US_deploy_4_3_token_scope_blocked():
    """US-deploy-4.3 (story US-deploy-4): token limited to Workers Scripts Edit on one account."""
    text = DOCS.read_text()
    assert "Workers Scripts Edit" in text and "account only" in text
    pytest.skip(BLOCKED_CF)


def test_US_deploy_4_4_no_cookies_on_dev(page, context, base_url, api):
    """US-deploy-4.4 (story US-deploy-4): `/` and `/api/health` set no cookies."""
    page.goto(base_url + "/")
    page.wait_for_load_state("networkidle")
    page.goto(base_url + "/api/health")
    assert context.cookies() == []
    assert "set-cookie" not in api.get("/api/health").headers


def test_US_deploy_4_4b_smoke_check_rejects_set_cookie():
    """US-deploy-4.4 (story US-deploy-4): the smoke step fails when /api/health sets a cookie."""
    srv = _serve(_GoodCookie)
    try:
        r = _smoke(f"http://127.0.0.1:{srv.server_address[1]}")
    finally:
        srv.shutdown()
    assert r.returncode == 1
    assert "cookie" in (r.stdout + r.stderr).lower()


def test_US_deploy_4_5_health_exposes_no_internal_data(api):
    """US-deploy-4.5 (story US-deploy-4): /api/health body has only `status`."""
    r = api.get("/api/health")
    body = r.json()
    assert list(body.keys()) == ["status"]
    text = r.text().lower()
    for word in ["env", "secret", "version", "host", "token", "workers.dev"]:
        assert word not in text

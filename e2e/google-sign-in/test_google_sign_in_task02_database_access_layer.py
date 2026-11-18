"""E2E checks for google-sign-in task 02 (docs/tasks/google-sign-in/02-database-access-layer.md).

The feature spec has no user story for this backend task (spec gap, reported), so cases are named
after the task's Verification items: T02-V1 to T02-V4. No database URL value is read or printed.
Never run against production.
"""
import json
import os
import re
import shutil
import urllib.request

import pytest

from helpers import ROOT, run


def test_T02_V1_getdb_reads_database_url_per_request_and_never_echoes_it():
    """T02-V1 (Vitest item, static half): getDb reads DATABASE_URL inside the function and the error names it without its value."""
    src = (ROOT / "src/server/db/index.ts").read_text()
    body = src.split("export function getDb", 1)[1]
    assert "process.env.DATABASE_URL" in body, "DATABASE_URL must be read per call"
    assert re.search(r"throw new Error\(\s*'DATABASE_URL is not set", body)
    assert not re.search(r"Error\([^)]*\$\{[^}]*url", body), "error message must not interpolate the URL"
    assert "console." not in src


def test_T02_V1b_vitest_suite_for_getdb_passes():
    """T02-V1: the unit tests for getDb pass."""
    if not shutil.which("pnpm"):
        pytest.skip("BLOCKED: pnpm not available")
    r = run(["pnpm", "test", "src/server/db/index.test.ts"])
    assert r.returncode == 0, (r.stdout + r.stderr)[-400:]


def test_T02_V2_health_still_serves_200():
    """T02-V2: /api/health still returns 200 after the database layer was added (needs a running local or dev server)."""
    base = os.environ.get("E2E_BASE_URL", "http://localhost:3000")
    try:
        with urllib.request.urlopen(base + "/api/health", timeout=10) as r:
            status, body = r.status, r.read().decode()
    except OSError as e:
        pytest.skip(f"BLOCKED: no server reachable at {base}: {e}")
    assert status == 200
    assert json.loads(body) == {"status": "ok"}


def test_T02_V3a_db_scripts_and_drizzle_config_exist():
    """T02 checklist: db:generate and db:migrate scripts, drizzle config, and the three dependencies."""
    pkg = json.loads((ROOT / "package.json").read_text())
    assert pkg["scripts"]["db:generate"] == "drizzle-kit generate"
    assert pkg["scripts"]["db:migrate"] == "drizzle-kit migrate"
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    for name in ("drizzle-orm", "drizzle-kit", "@neondatabase/serverless"):
        assert name in deps, f"{name} missing"
    cfg = (ROOT / "drizzle.config.ts").read_text()
    assert "DATABASE_URL" in cfg and "./drizzle" in cfg


def test_T02_V3b_db_migrate_against_neon_branch():
    """T02-V3 (task Verification 3): pnpm db:migrate against a developer Neon branch. DEFERRED to task 03."""
    pytest.skip("BLOCKED: deferred to task 03; no developer Neon branch URL is available (see task file)")


def test_T02_V5_database_url_not_in_committed_files():
    """Security: no connection string is committed (postgres URL with credentials) in the new files."""
    for rel in ("src/server/db/index.ts", "drizzle.config.ts", ".env.example"):
        p = ROOT / rel
        if p.exists():
            assert not re.search(r"postgres(ql)?://[^\s:/]+:[^\s@]+@", p.read_text()), f"credentials in {rel}"

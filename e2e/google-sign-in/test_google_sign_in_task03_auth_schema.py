"""E2E checks for google-sign-in task 03 (docs/tasks/google-sign-in/03-auth-schema-and-first-migration.md).

The feature spec has no user story for this backend task (spec gap, reported), so cases are named
after the task's Verification items: T03-V1 to T03-V3. Static checks of the committed schema and
migration; the live migrate check needs a Neon branch and is BLOCKED without one. Never run against production.
"""
import json
import os
import re
import shutil

import pytest

from helpers import ROOT, run

MIGRATION_DIR = ROOT / "drizzle"


def _sql() -> str:
    files = sorted(MIGRATION_DIR.glob("*.sql"))
    assert files, "no SQL migration committed under drizzle/"
    return "\n".join(f.read_text() for f in files)


def test_T03_V1a_first_migration_creates_the_four_tables():
    """T03-V1 (static half): the committed migration creates user, session, account and verification."""
    sql = _sql()
    for table in ("user", "session", "account", "verification"):
        assert re.search(rf'CREATE TABLE "{table}"', sql), f"table {table} missing"


def test_T03_V1b_journal_has_a_single_first_migration():
    """T03-V1: the drizzle journal lists the first migration, so a second db:migrate run has nothing new to apply."""
    journal = json.loads((MIGRATION_DIR / "meta/_journal.json").read_text())
    assert len(journal["entries"]) == 1
    assert (MIGRATION_DIR / f"{journal['entries'][0]['tag']}.sql").exists()


def test_T03_V1c_db_migrate_on_fresh_branch_and_rerun():
    """T03-V1 (live half): pnpm db:migrate creates the tables, and a second run is a no-op."""
    url = os.environ.get("E2E_NEON_BRANCH_URL")
    if not url or not shutil.which("pnpm"):
        pytest.skip("BLOCKED: no Neon developer branch URL (E2E_NEON_BRANCH_URL) available")
    env = {**os.environ, "DATABASE_URL": url}
    first = run(["pnpm", "db:migrate"], env=env)
    second = run(["pnpm", "db:migrate"], env=env)
    assert first.returncode == 0, (first.stdout + first.stderr)[-400:]
    assert second.returncode == 0, (second.stdout + second.stderr)[-400:]


def test_T03_V2a_unique_index_on_user_email():
    """T03-V2: user.email is unique."""
    assert re.search(r'CONSTRAINT "user_email_unique" UNIQUE\("email"\)', _sql())


def test_T03_V2b_session_and_account_reference_user():
    """T03-V2: session and account have a foreign key to user."""
    sql = _sql()
    for table in ("session", "account"):
        assert re.search(
            rf'ALTER TABLE "{table}" ADD CONSTRAINT "\w+" FOREIGN KEY \("user_id"\) REFERENCES "public"\."user"\("id"\)', sql
        ), f"{table}.user_id foreign key missing"


def test_T03_V3_vitest_schema_suite_passes():
    """T03-V3: the Vitest schema test (exports the four tables) passes."""
    if not shutil.which("pnpm"):
        pytest.skip("BLOCKED: pnpm not available")
    r = run(["pnpm", "test", "src/server/db/schema.test.ts"])
    assert r.returncode == 0, (r.stdout + r.stderr)[-400:]


def test_T03_S1_no_credentials_in_migration_or_schema():
    """Security: no connection string or secret is committed in the migration or schema."""
    text = _sql() + (ROOT / "src/server/db/schema/auth.ts").read_text()
    assert not re.search(r"postgres(ql)?://[^\s:/]+:[^\s@]+@", text)

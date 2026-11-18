"""E2E checks for google-sign-in task 03 (docs/tasks/google-sign-in/03-auth-schema-and-first-migration.md).

The feature spec has no user story for this backend task (spec gap, reported), so cases are named
after the task's Verification items: T03-V1 to T03-V3. Static checks of the committed schema and
migration; the live migrate check needs an empty Neon developer branch (E2E_NEON_BRANCH_URL plus E2E_ALLOW_MIGRATE=1) and is BLOCKED without one. Never run against production.
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


def test_T03_V1b_journal_and_sql_files_match():
    """T03-V1: the journal has entry idx 0 and every journal entry has a .sql file, and the reverse."""
    journal = json.loads((MIGRATION_DIR / "meta/_journal.json").read_text())
    entries = journal["entries"]
    assert any(e["idx"] == 0 for e in entries), "journal has no entry idx 0"
    tags = {e["tag"] for e in entries}
    files = {f.stem for f in MIGRATION_DIR.glob("*.sql")}
    assert tags == files, f"journal and .sql files differ: {tags ^ files}"


_QUERY_JS = """
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const tables = (await sql.query("select table_schema || '.' || table_name as t from information_schema.tables where table_schema in ('public','drizzle')")).map((r) => r.t)
let count = 0
if (tables.includes('drizzle.__drizzle_migrations')) {
  count = Number((await sql.query('select count(*) as c from drizzle.__drizzle_migrations'))[0].c)
}
console.log(JSON.stringify({ tables, count }))
"""


def _state(env):
    r = run(["node", "--input-type=module", "-e", _QUERY_JS], env=env)
    assert r.returncode == 0, (r.stdout + r.stderr)[-400:]
    return json.loads(r.stdout.strip().splitlines()[-1])


def test_T03_V1c_db_migrate_on_fresh_branch_and_rerun():
    """T03-V1 (live half): pnpm db:migrate creates the tables on an empty branch, and a second run is a no-op."""
    url = os.environ.get("E2E_NEON_BRANCH_URL")
    if not url:
        pytest.skip("BLOCKED: no Neon developer branch URL (E2E_NEON_BRANCH_URL) available")
    if not shutil.which("pnpm") or not shutil.which("node"):
        pytest.skip("BLOCKED: pnpm or node not available")
    # Guard: a DDL migration must never hit production or a shared database.
    assert os.environ.get("E2E_ALLOW_MIGRATE") == "1", (
        "refusing to run DDL: set E2E_ALLOW_MIGRATE=1 to confirm E2E_NEON_BRANCH_URL is a throwaway developer branch"
    )
    env = {**os.environ, "DATABASE_URL": url}
    before = _state(env)
    assert "drizzle.__drizzle_migrations" not in before["tables"], "branch is not fresh (migrations table exists)"
    assert not any(t.startswith("public.") for t in before["tables"]), "branch is not fresh (public tables exist)"
    first = run(["pnpm", "db:migrate"], env=env)
    assert first.returncode == 0, (first.stdout + first.stderr)[-400:]
    after_first = _state(env)
    for table in ("user", "session", "account", "verification"):
        assert f"public.{table}" in after_first["tables"], f"table {table} not created"
    second = run(["pnpm", "db:migrate"], env=env)
    assert second.returncode == 0, (second.stdout + second.stderr)[-400:]
    assert _state(env)["count"] == after_first["count"], "second run applied migrations again"


def test_T03_domain_name_user_table_is_exported():
    """Checklist: the schema exports `user` as the User table (domain name)."""
    text = (ROOT / "src/server/db/schema/auth.ts").read_text()
    assert re.search(r"export const user = pgTable\('user'", text)


def test_T03_V2a_unique_index_on_user_email():
    """T03-V2: user.email is unique."""
    assert re.search(r'CONSTRAINT "user_email_unique" UNIQUE\("email"\)', _sql())


def test_T03_V2b_session_and_account_reference_user():
    """T03-V2: session and account have a foreign key to user, deleting the User cascades."""
    sql = _sql()
    for table in ("session", "account"):
        assert re.search(
            rf'ALTER TABLE "{table}" ADD CONSTRAINT "\w+" FOREIGN KEY \("user_id"\) REFERENCES "public"\."user"\("id"\) ON DELETE cascade', sql
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

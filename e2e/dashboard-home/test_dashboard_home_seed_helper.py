"""Unit checks of helpers.add_seeded_session (second Session for US-dashboard-home-3.3). No browser, server or database
(a fake connection stands in for psycopg)."""
import types
from datetime import timedelta

import pytest

import helpers
from helpers import SeedRefused, add_seeded_session

SEEDED = {"user_id": "e2e-user-abc"}


def test_refuses_non_local_server(monkeypatch):
    monkeypatch.setenv("E2E_SEED_DATABASE_URL", "postgres" + "ql://u:p@localhost:5432/t")
    monkeypatch.setenv("E2E_BETTER_AUTH_SECRET", "s")
    with pytest.raises(SeedRefused, match="E2E_BASE_URL"):
        add_seeded_session(SEEDED, "https://sweetmemories.com")


def test_refuses_without_database(monkeypatch):
    monkeypatch.delenv("E2E_SEED_DATABASE_URL", raising=False)
    monkeypatch.setenv("E2E_BETTER_AUTH_SECRET", "s")
    with pytest.raises(SeedRefused, match="DATABASE_URL"):
        add_seeded_session(SEEDED, "http://localhost:3000")


def test_refuses_a_user_it_did_not_seed(monkeypatch):
    monkeypatch.setenv("E2E_SEED_DATABASE_URL", "postgres" + "ql://u:p@localhost:5432/t")
    monkeypatch.setenv("E2E_BETTER_AUTH_SECRET", "s")
    with pytest.raises(SeedRefused, match="seed_signed_in_session"):
        add_seeded_session({"user_id": "real-user-1"}, "http://localhost:3000")


class _FakeConn:
    """Records execute() calls in place of a psycopg connection."""

    def __init__(self):
        self.calls = []

    def execute(self, sql, params):
        self.calls.append((sql, params))

    def transaction(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


@pytest.fixture
def fake_db(monkeypatch):
    conn = _FakeConn()
    monkeypatch.setenv("E2E_SEED_DATABASE_URL", "postgres" + "ql://u:p@localhost:5432/t")
    monkeypatch.setenv("E2E_BETTER_AUTH_SECRET", "s")
    monkeypatch.setattr(helpers, "_psycopg", lambda: types.SimpleNamespace(connect=lambda *a, **k: conn))
    return conn


def _session_inserts(conn):
    return [(sql, params) for sql, params in conn.calls if sql.startswith("INSERT INTO session")]


def test_insert_session_sets_expiry_and_returns_token():
    conn = _FakeConn()
    token = helpers._insert_session(conn, "e2e-user-abc", -1)
    [(sql, (session_id, expires_at, row_token, created_at, _, user_id))] = _session_inserts(conn)
    assert session_id.startswith("e2e-session-") and row_token == token and user_id == "e2e-user-abc"
    assert expires_at - created_at == timedelta(days=-1)


def test_seed_and_add_session_share_one_session_insert(fake_db):
    sam = helpers.seed_signed_in_session("http://localhost:3000")
    second = add_seeded_session(sam, "http://localhost:3000")
    (first_sql, first_params), (second_sql, second_params) = _session_inserts(fake_db)
    assert first_sql == second_sql
    assert first_params[5] == second_params[5] == sam["user_id"]
    assert (first_params[2], second_params[2]) == (sam["token"], second["token"])
    assert second["cookie_value"] == helpers.sign_cookie_value(second["token"], "s")

"""Unit checks of helpers.add_seeded_session (second Session for US-dashboard-home-3.3). No browser, server or database."""
import pytest

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

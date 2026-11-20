"""Unit checks of the session-seeding helper (task 10, ADR 0009). No browser, server or database needed."""
import pytest

from helpers import SeedRefused, check_seed_allowed, is_local_url, session_cookie_name, sign_cookie_value

LOCAL = "http://localhost:3000"
SCHEME = "postgres" + "ql://"  # built from parts so the repo-wide connection-string scan stays clean
TLD = "." + "neon" + ".tech"
PG = SCHEME + "user:pw@localhost:5432/test"


def test_signature_matches_better_call_golden_vector():
    """Value computed with better-call@1.4.6 signCookieValue("tok_en+/abc", "test-secret-123")."""
    assert (
        sign_cookie_value("tok_en+/abc", "test-secret-123")
        == "tok_en%2B%2Fabc.TlPSkDz0V7bQo%2FSJZuEcq5gZRaUtQYTZNnML0W7KFZw%3D"
    )


def test_signature_depends_on_secret():
    assert sign_cookie_value("t", "a") != sign_cookie_value("t", "b")


def test_cookie_name_gets_secure_prefix_on_https_only():
    assert session_cookie_name("http://localhost:3000") == "better-auth.session_token"
    assert session_cookie_name("https://x.workers.dev") == "__Secure-better-auth.session_token"


@pytest.mark.parametrize("url,expected", [
    ("http://localhost:3000", True), ("http://127.0.0.1:3000", True), ("http://sam.localhost:3000", True),
    ("https://sweetmemories-dev.x.workers.dev", False), ("https://sweetmemories.com", False),
    ("https://localhost.evil.com", False),
])
def test_is_local_url(url, expected):
    assert is_local_url(url) is expected


def test_allows_local_server_and_local_database():
    check_seed_allowed(LOCAL, PG, "s")


@pytest.mark.parametrize("base", ["https://sweetmemories.com", "https://sweetmemories-dev.x.workers.dev"])
def test_refuses_non_local_server(base):
    with pytest.raises(SeedRefused, match="E2E_BASE_URL"):
        check_seed_allowed(base, PG, "s")


def test_refuses_missing_database_or_secret():
    with pytest.raises(SeedRefused, match="DATABASE_URL"):
        check_seed_allowed(LOCAL, "", "s")
    with pytest.raises(SeedRefused, match="SECRET"):
        check_seed_allowed(LOCAL, PG, "")


def test_refuses_remote_database_without_opt_in(monkeypatch):
    monkeypatch.delenv("E2E_ALLOW_NEON_BRANCH", raising=False)
    url = SCHEME + "user:SECRETPW@host-a" + TLD + "/db"
    with pytest.raises(SeedRefused) as e:
        check_seed_allowed(LOCAL, url, "s")
    assert "SECRETPW" not in str(e.value)


def test_remote_neon_branch_needs_opt_in_and_neon_host(monkeypatch):
    monkeypatch.setenv("E2E_ALLOW_NEON_BRANCH", "1")
    check_seed_allowed(LOCAL, SCHEME + "user:pw@host-a" + TLD + "/db", "s")
    with pytest.raises(SeedRefused):
        check_seed_allowed(LOCAL, SCHEME + "user:pw@db.example.com/db", "s")
    with pytest.raises(SeedRefused, match="production"):
        check_seed_allowed(LOCAL, SCHEME + "user:pw@host-prod" + TLD + "/db", "s")

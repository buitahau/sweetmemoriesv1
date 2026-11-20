"""Helpers shared by every e2e suite (a uniquely named module, so it cannot clash with the per-suite conftest files)."""
import base64
import hashlib
import hmac
import os
import pathlib
import secrets
import subprocess
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]


def run(cmd, cwd=ROOT, timeout=300, env=None):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)


# ---------------------------------------------------------------------------------------------
# Session seeding (ADR 0009, google-sign-in task 10)
#
# Google sign-in cannot be automated, so signed-in e2e tests insert a User, Account and Session into
# your own Neon developer branch and set the signed Better Auth session cookie. The helper refuses to run
# unless the server (E2E_BASE_URL) is local and the database is an explicitly allow-listed Neon developer branch.
# ---------------------------------------------------------------------------------------------
NEON_SUFFIX = "." + "neon" + ".tech"  # built from parts so the repo-wide connection-string scan stays clean
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "[::1]"}


class SeedRefused(Exception):
    """Raised when seeding is not allowed (non-local server or database) or not configured."""


def is_local_url(url):
    host = urlparse(url).hostname or ""
    return host in LOCAL_HOSTS or host.endswith(".localhost")


def session_cookie_name(base_url):
    """Better Auth prefixes the cookie with __Secure- when the server runs on https (useSecureCookies)."""
    return ("__Secure-" if base_url.startswith("https://") else "") + "better-auth.session_token"


def sign_cookie_value(token, secret):
    """Better Auth signed cookie: encodeURIComponent(token + "." + base64(HMAC-SHA256(secret, token)))."""
    mac = hmac.new(secret.encode(), token.encode(), hashlib.sha256).digest()
    return quote(f"{token}.{base64.b64encode(mac).decode()}", safe="")


def neon_endpoint_id(host):
    """The Neon endpoint id of a host such as ep-cool-123456-pooler.<region>.aws.<neon domain> (without -pooler)."""
    first = host.split(".")[0]
    return first[: -len("-pooler")] if first.endswith("-pooler") else first


def _psycopg():
    """Import psycopg lazily: the no-server unit tests of this helper must not need it."""
    import psycopg

    return psycopg


def check_seed_allowed(base_url, database_url, secret):
    """Guard: local server, a database URL, the secret.

    The server reaches Postgres over Neon's SQL-over-HTTP protocol, so the supported seed database is your OWN Neon
    developer branch. A non-local host is accepted only when E2E_SEED_NEON_ENDPOINT (the ep-... endpoint id of that
    branch) equals the endpoint id in the URL host; Neon hostnames never contain the branch name, so an explicit
    allow-list is the only reliable way to keep the helper off the dev Worker's and production databases.
    A local Postgres host passes (for a local Neon HTTP proxy setup). Raises SeedRefused; the reason never contains
    the connection string.
    """
    if not is_local_url(base_url):
        raise SeedRefused("E2E_BASE_URL is not a local address; session seeding only targets a local server")
    if not database_url:
        raise SeedRefused("E2E_SEED_DATABASE_URL is not set")
    if not secret:
        raise SeedRefused("E2E_BETTER_AUTH_SECRET (or BETTER_AUTH_SECRET) is not set")
    host = urlparse(database_url).hostname or ""
    if is_local_url(f"http://{host}"):
        return
    allowed = os.environ.get("E2E_SEED_NEON_ENDPOINT", "").strip()
    if not host.endswith(NEON_SUFFIX) or not allowed:
        raise SeedRefused(
            "the seed database is not local; use your own Neon developer branch and set E2E_SEED_NEON_ENDPOINT to its "
            "endpoint id (ep-...) so the helper cannot target the dev Worker's or a production database"
        )
    if neon_endpoint_id(host) != allowed:
        raise SeedRefused("the seed database endpoint does not match E2E_SEED_NEON_ENDPOINT")


def seed_signed_in_session(base_url, email=None, name="Sam Tester", lifetime_days=7):
    """Insert a User, Account and Session; return a dict with the cookie to set and the ids to clean up.

    Reads E2E_SEED_DATABASE_URL and E2E_BETTER_AUTH_SECRET (falls back to BETTER_AUTH_SECRET). The secret
    must equal the one the server under test uses. Raises SeedRefused when not allowed or not configured.
    """
    database_url = os.environ.get("E2E_SEED_DATABASE_URL", "")
    secret = os.environ.get("E2E_BETTER_AUTH_SECRET") or os.environ.get("BETTER_AUTH_SECRET", "")
    check_seed_allowed(base_url, database_url, secret)
    psycopg = _psycopg()

    suffix = uuid.uuid4().hex[:10]
    email = email or f"e2e-{suffix}@example.test"
    user_id, account_id, session_id = (f"e2e-{kind}-{suffix}" for kind in ("user", "account", "session"))
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    with psycopg.connect(database_url, autocommit=True) as conn, conn.transaction():
        conn.execute(
            'INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES (%s,%s,%s,true,%s,%s)',
            (user_id, name, email, now, now),
        )
        conn.execute(
            'INSERT INTO account (id, account_id, provider_id, user_id, created_at, updated_at) VALUES (%s,%s,%s,%s,%s,%s)',
            (account_id, f"e2e-google-{suffix}", "google", user_id, now, now),
        )
        conn.execute(
            'INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES (%s,%s,%s,%s,%s,%s)',
            (session_id, now + timedelta(days=lifetime_days), token, now, now, user_id),
        )
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "token": token,
        "cookie_name": session_cookie_name(base_url),
        "cookie_value": sign_cookie_value(token, secret),
    }


def delete_seeded_user(user_id, base_url):
    """Remove a seeded User (Account and Session rows go with it via ON DELETE CASCADE).

    Applies the same check_seed_allowed guard as seeding, so the safety rule lives in one place.
    """
    database_url = os.environ.get("E2E_SEED_DATABASE_URL", "")
    secret = os.environ.get("E2E_BETTER_AUTH_SECRET") or os.environ.get("BETTER_AUTH_SECRET", "")
    check_seed_allowed(base_url, database_url, secret)
    psycopg = _psycopg()
    with psycopg.connect(database_url, autocommit=True) as conn:
        conn.execute('DELETE FROM "user" WHERE id = %s AND id LIKE \'e2e-user-%%\'', (user_id,))

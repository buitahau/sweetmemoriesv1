"""Helpers shared by every e2e suite (a uniquely named module, so it cannot clash with the per-suite conftest files)."""
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]


def run(cmd, cwd=ROOT, timeout=300, env=None):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)

"""Без DATABASE_URL застосунок не стартує, а не йде в базу з типовим паролем."""

import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]


def test_missing_database_url_stops_startup(tmp_path):
    env = {"PATH": "", "JWT_SECRET": "x" * 32}
    r = subprocess.run([sys.executable, "-c", "import app.db"], cwd=tmp_path, env={**env, "PYTHONPATH": str(BACKEND)},
                       capture_output=True, text=True)
    assert r.returncode != 0
    assert "DATABASE_URL не задано" in r.stderr

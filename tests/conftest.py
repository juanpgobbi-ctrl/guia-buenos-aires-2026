import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))


@pytest.fixture(scope="session")
def data():
    return json.loads((ROOT / "site" / "data.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def root():
    return ROOT

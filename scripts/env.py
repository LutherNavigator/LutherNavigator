import os

from typing import Dict


def load_env(filename: str) -> None:
    """Load the environment variable."""

    with open(filename, "r") as f:
        for line in f:
            line: str = line.strip()
            eq_idx: int = line.find("=")

            if eq_idx != -1:
                key: str = line[:eq_idx]
                value: str = line[eq_idx + 1 :]
                os.environ[key] = value


def get_env(filename: str) -> Dict[str, str]:
    """Get the environment variables."""

    env: Dict[str, str] = {}
    with open(filename, "r") as f:
        for line in f:
            line: str = line.strip()
            eq_idx: int = line.find("=")

            if eq_idx != -1:
                key: str = line[:eq_idx]
                value: str = line[eq_idx + 1 :]
                env[key] = value

    return env

"""Encrypt / decrypt timeline seed for participant packages."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

SEED_DIR = Path(__file__).resolve().parents[1] / "seed"
TIMELINE_JSON = SEED_DIR / "tradeverse_timeline.json"
TIMELINE_ENC = SEED_DIR / "tradeverse_timeline.enc"


def encrypt_timeline_json(key: str, *, source: Path | None = None, dest: Path | None = None) -> Path:
    src = source or TIMELINE_JSON
    out = dest or TIMELINE_ENC
    if not src.is_file():
        raise FileNotFoundError(f"timeline source not found: {src}")
    fernet = Fernet(key.encode("utf-8"))
    plaintext = src.read_bytes()
    token = fernet.encrypt(plaintext)
    out.write_bytes(token)
    return out


def decrypt_timeline_bytes(key: str, blob: bytes) -> dict[str, Any]:
    fernet = Fernet(key.encode("utf-8"))
    try:
        decrypted = fernet.decrypt(blob)
    except InvalidToken as exc:
        raise ValueError("invalid TIMELINE_DECRYPT_KEY — cannot decrypt timeline") from exc
    data = json.loads(decrypted.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("decrypted timeline is not a JSON object")
    return data


def load_timeline_data(key: str | None) -> dict[str, Any]:
    """Load timeline from plaintext JSON or encrypted blob."""
    if TIMELINE_JSON.is_file():
        with TIMELINE_JSON.open(encoding="utf-8") as f:
            return json.load(f)
    if TIMELINE_ENC.is_file():
        if not key:
            raise ValueError(
                "Timeline is encrypted — set TIMELINE_DECRYPT_KEY in .env (organizer provides at event start)"
            )
        return decrypt_timeline_bytes(key, TIMELINE_ENC.read_bytes())
    raise ValueError("Timeline not available — ask organizer for the event package or key")

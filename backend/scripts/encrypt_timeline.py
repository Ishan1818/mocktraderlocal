"""CLI: encrypt tradeverse_timeline.json for participant packages."""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cryptography.fernet import Fernet

from app.services.timeline_crypto import encrypt_timeline_json, TIMELINE_ENC, TIMELINE_JSON


def main() -> int:
    key = os.environ.get("TIMELINE_DECRYPT_KEY")
    if not key:
        key = Fernet.generate_key().decode("utf-8")
        print("Generated TIMELINE_DECRYPT_KEY (save for organizer .env and event-day announcement):")
        print(key)
    if not TIMELINE_JSON.is_file():
        print(f"Missing {TIMELINE_JSON}", file=sys.stderr)
        return 1
    out = encrypt_timeline_json(key)
    print(f"Written encrypted timeline: {out}")
    print(f"Plaintext kept at {TIMELINE_JSON} (exclude from participant zip)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

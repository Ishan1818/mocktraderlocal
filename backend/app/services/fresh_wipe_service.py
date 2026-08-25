"""Hard wipe local SQLite so the market starts like a fresh install."""

from __future__ import annotations

import logging
import time
from pathlib import Path

from sqlalchemy.orm import close_all_sessions

from app.core.config import get_settings
from app.core.database import SessionLocal, engine, init_db
from app.exchange.book_registry import books
from app.services.simulation_controller import reset_simulation

logger = logging.getLogger(__name__)


class FreshWipeError(Exception):
    """Could not wipe local database."""


def _sqlite_file_paths() -> list[Path]:
    settings = get_settings()
    url = settings.database_url
    if not url.startswith("sqlite"):
        raise FreshWipeError("fresh wipe only supported for SQLite local mode")
    raw = url.split("sqlite+pysqlite:///", 1)[-1]
    if raw.startswith("/") and len(raw) > 2 and raw[2] == ":":
        raw = raw[1:]
    base = Path(raw)
    return [base, Path(str(base) + "-wal"), Path(str(base) + "-shm")]


def fresh_wipe_local_db() -> dict:
    """Dispose connections, delete SQLite files, recreate schema + universe."""
    settings = get_settings()
    if not settings.local_instance_mode:
        raise FreshWipeError("fresh wipe only in local instance mode")

    paths = _sqlite_file_paths()
    books.clear()
    close_all_sessions()
    engine.dispose()

    deleted: list[str] = []
    for path in paths:
        for _ in range(8):
            try:
                if path.is_file():
                    path.unlink()
                    deleted.append(str(path))
                break
            except OSError:
                time.sleep(0.15)
        else:
            if path.is_file():
                raise FreshWipeError(f"could not delete locked file: {path}")

    init_db()
    db = SessionLocal()
    try:
        result = reset_simulation(db)
    finally:
        db.close()

    logger.info("Fresh wipe complete; deleted=%s", deleted)
    return {
        "ok": True,
        "action": "fresh_wipe",
        "deleted_files": deleted,
        "db_path": str(paths[0]),
        "tradable_stocks": result.get("tradable_stocks"),
        "status": result.get("status"),
        "elapsed": result.get("elapsed"),
        "trading_enabled": result.get("trading_enabled"),
    }

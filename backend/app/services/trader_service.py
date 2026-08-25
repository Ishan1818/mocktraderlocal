"""Trader and user creation / lookup."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.exchange.book_registry import books
from app.models import (
    ConditionalOrder,
    Holding,
    IPOApplication,
    Order,
    Trade,
    Trader,
    TraderType,
    User,
    UserRole,
)
from app.models.order_enums import OrderStatus
from app.schemas import TraderCreate
from app.services.order_service import list_orders


class TraderServiceError(Exception):
    """Domain error for trader operations."""


def create_trader(db: Session, payload: TraderCreate) -> Trader:
    settings = get_settings()
    capital = payload.starting_capital
    if capital is None:
        capital = Decimal(str(settings.default_starting_capital))
    if capital <= 0:
        raise TraderServiceError("starting_capital must be positive")

    user: User | None = None
    if payload.username:
        username = payload.username.strip().lower()
        existing = db.scalar(select(User).where(User.username == username))
        if existing:
            raise TraderServiceError(f"username already exists: {username}")
        user = User(
            username=username,
            display_name=payload.name,
            role=UserRole.PARTICIPANT,
            password_hash=None,
        )
        db.add(user)
        db.flush()

    trader = Trader(
        name=payload.name,
        trader_type=payload.trader_type,
        starting_capital=capital,
        cash=capital,
        cash_blocked_ipo=Decimal("0.00"),
        realized_pnl=Decimal("0.00"),
        user_id=user.id if user else None,
        session_id=payload.session_id,
    )
    db.add(trader)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise TraderServiceError("could not create trader") from exc
    db.refresh(trader)
    return trader


def get_trader(db: Session, trader_id: int) -> Trader | None:
    return db.get(Trader, trader_id)


def list_traders(db: Session, *, trader_type: TraderType | None = None) -> list[Trader]:
    stmt = select(Trader).order_by(Trader.id)
    if trader_type is not None:
        stmt = stmt.where(Trader.trader_type == trader_type)
    return list(db.scalars(stmt).all())


def reset_trader_progress(db: Session, trader_id: int) -> dict:
    """Reset one human trader's portfolio without touching the global simulation clock."""
    trader = get_trader(db, trader_id)
    if trader is None:
        raise TraderServiceError("trader not found")

    for order in list_orders(db, trader_id=trader_id, open_only=True):
        try:
            books.get(order.stock_id).remove_order(order.id)
        except Exception:  # noqa: BLE001
            pass
        order.status = OrderStatus.CANCELLED
        order.remaining_quantity = 0

    db.execute(
        delete(Trade).where((Trade.buyer_id == trader_id) | (Trade.seller_id == trader_id))
    )
    db.execute(delete(Order).where(Order.trader_id == trader_id))
    db.execute(delete(ConditionalOrder).where(ConditionalOrder.trader_id == trader_id))
    db.execute(delete(Holding).where(Holding.trader_id == trader_id))
    db.execute(delete(IPOApplication).where(IPOApplication.trader_id == trader_id))

    trader.cash = trader.starting_capital
    trader.cash_blocked_ipo = Decimal("0")
    trader.realized_pnl = Decimal("0")
    trader.is_active = True

    db.commit()
    db.refresh(trader)
    return {
        "ok": True,
        "action": "reset_progress",
        "trader_id": trader_id,
        "starting_capital": str(trader.starting_capital),
    }

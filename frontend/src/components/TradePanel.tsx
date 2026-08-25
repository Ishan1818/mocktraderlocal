"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint } from "@/hooks/usePriceChart";
import { fmtPct, num, signClass } from "@/lib/marketFormat";
import type { SidebarStock } from "./StockSidebar";

const UP = "#22c55e";
const DOWN = "#ef4444";

type Props = {
  stock: SidebarStock | null;
  priceSeries: PricePoint[];
  chartLoading?: boolean;
  qty: number;
  onQtyChange: (n: number) => void;
  holdingQty: number;
  tradingEnabled: boolean;
  onBuy: () => void;
  onSell: () => void;
  confirmSide: "buy" | "sell" | null;
  confirmLoading: boolean;
  confirmError: string | null;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  ipo?: {
    id: number;
    company_name: string;
    ticker: string;
    issue_price: string;
    lot_size: number;
    maximum_lots_per_user: number;
  } | null;
  ipoLots: number;
  onIpoLotsChange: (n: number) => void;
  onIpoApply?: () => void;
};

export function TradePanel({
  stock,
  priceSeries,
  chartLoading = false,
  qty,
  onQtyChange,
  holdingQty,
  tradingEnabled,
  onBuy,
  onSell,
  confirmSide,
  confirmLoading,
  confirmError,
  onConfirm,
  onCancelConfirm,
  ipo,
  ipoLots,
  onIpoLotsChange,
  onIpoApply,
}: Props) {
  const chartStroke =
    priceSeries.length >= 2 && priceSeries[priceSeries.length - 1].px >= priceSeries[0].px ? UP : DOWN;

  const yDomain = useMemo((): [number, number] => {
    if (priceSeries.length === 0) return [0, 1];
    const prices = priceSeries.map((p) => p.px);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = Math.max((max - min) * 0.02, max * 0.005, 0.05);
    return [min - pad, max + pad];
  }, [priceSeries]);

  const estimatedValue = stock ? qty * num(stock.last_traded_price) : 0;
  const canTrade = tradingEnabled && !!stock;
  const inputCls =
    "w-full rounded border border-[var(--line)] bg-[var(--background)] px-3 py-2.5 font-mono text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

  return (
    <main className="flex min-h-0 flex-1 flex-col border border-[var(--line)] bg-[var(--panel)]/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-sans text-lg sm:text-xl">
            {stock?.company_name ?? "Select a stock"}
          </h1>
          <p className="font-mono text-xs text-[var(--muted)]">{stock?.ticker ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl tabular-nums sm:text-3xl">
            {stock ? num(stock.last_traded_price).toFixed(2) : "—"}
          </p>
          <p className={`text-sm ${signClass(stock?.percent_change)}`}>
            {stock ? fmtPct(stock.percent_change) : "—"}
          </p>
        </div>
      </div>

      <div className="relative mt-3 h-56 rounded border border-[var(--line)] p-2 sm:h-72 lg:h-96">
        {chartLoading && priceSeries.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted)]">
            Loading chart…
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceSeries}>
            <XAxis dataKey="t" hide />
            <YAxis domain={yDomain} width={48} tick={{ fill: "#93a4bd", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="px"
              stroke={chartStroke}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!tradingEnabled && (
        <p className="mt-3 rounded border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-3 py-2 text-xs text-[var(--warn)]">
          Trading opens when the simulation starts.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:max-w-md">
        <div>
          <label className="font-sans text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            className={`${inputCls} mt-1`}
            value={qty}
            onChange={(e) => onQtyChange(Number(e.target.value))}
          />
          <p className="mt-1 text-[10px] text-[var(--muted)]">Holding: {holdingQty}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canTrade}
            title={!tradingEnabled ? "Wait for simulation to start" : undefined}
            className="rounded bg-[var(--accent)] py-3.5 font-sans text-base font-semibold text-[#0b1220] disabled:opacity-40 sm:py-4"
            onClick={onBuy}
          >
            Buy
          </button>
          <button
            type="button"
            disabled={!canTrade}
            title={!tradingEnabled ? "Wait for simulation to start" : undefined}
            className="rounded bg-[#ef4444] py-3.5 font-sans text-base font-semibold text-[#0b1220] disabled:opacity-40 sm:py-4"
            onClick={onSell}
          >
            Sell
          </button>
        </div>
      </div>

      {ipo && onIpoApply && (
        <div className="mt-4 rounded border border-[var(--line)] p-3 text-xs sm:max-w-md">
          <p className="font-medium text-[var(--accent)]">New IPO</p>
          <p className="mt-1">
            {ipo.company_name} ({ipo.ticker}) · ₹{ipo.issue_price} · lot {ipo.lot_size}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min={1}
              max={ipo.maximum_lots_per_user}
              className={inputCls}
              value={ipoLots}
              onChange={(e) => onIpoLotsChange(Number(e.target.value))}
            />
            <button
              type="button"
              className="rounded border border-[var(--line)] px-4 py-2 hover:bg-white/5"
              onClick={onIpoApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {confirmSide && stock && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--panel)] p-4 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:border-0 sm:bg-black/70">
          <div className="mx-auto w-full max-w-sm rounded border border-[var(--line)] bg-[var(--panel)] p-4 shadow-xl">
            <p className="font-sans text-xs uppercase tracking-wider text-[var(--muted)]">
              Confirm order
            </p>
            <p className="mt-2 font-sans text-lg">
              {confirmSide === "buy" ? "Buy" : "Sell"} {qty} × {stock.ticker}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              @ ₹{num(stock.last_traded_price).toFixed(2)} · Est. ₹
              {estimatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            {confirmError && <p className="mt-2 text-xs text-[#ef4444]">{confirmError}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded border border-[var(--line)] py-3 font-sans"
                disabled={confirmLoading}
                onClick={onCancelConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-1 rounded py-3 font-sans font-medium text-[#0b1220] ${
                  confirmSide === "buy" ? "bg-[var(--accent)]" : "bg-[#ef4444]"
                }`}
                disabled={confirmLoading}
                onClick={onConfirm}
              >
                {confirmLoading ? "Working…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

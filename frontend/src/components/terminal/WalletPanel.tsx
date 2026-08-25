"use client";

import { fmtMoney, signClass } from "@/lib/marketFormat";
import type { PortfolioSnapshot } from "@/lib/portfolioValuation";
import { num } from "@/lib/marketFormat";

type PricedStock = { ticker: string; last_traded_price: string };

type Props = {
  portfolio: PortfolioSnapshot | null;
  availableCash?: string | null;
  portfolioValue?: string | null;
  stocks: PricedStock[];
  open?: boolean;
};

export function WalletPanel({
  portfolio,
  availableCash,
  portfolioValue,
  stocks,
  open = true,
}: Props) {
  if (!open) return null;

  const priceByTicker = new Map(stocks.map((s) => [s.ticker, num(s.last_traded_price)]));
  const holdings = portfolio?.holdings?.filter((h) => h.ticker && h.quantity > 0) ?? [];
  const blocked = portfolio?.cash_blocked_ipo ?? "0";

  return (
    <section
      className="border-b border-[var(--line)] bg-[var(--panel)]/80 px-3 py-3 sm:px-4"
      aria-label="Wallet holdings"
    >
      <div className="overflow-x-auto">
        {holdings.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No holdings yet — pick a stock and place your first trade.
          </p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <th className="py-2 pr-3 font-medium">Ticker</th>
                <th className="py-2 pr-3 font-medium">Qty</th>
                <th className="py-2 pr-3 font-medium">Avg cost</th>
                <th className="py-2 pr-3 font-medium">Mkt price</th>
                <th className="py-2 pr-3 font-medium">Value</th>
                <th className="py-2 font-medium">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {holdings.map((h) => {
                const mkt =
                  h.market_price != null
                    ? num(h.market_price)
                    : priceByTicker.get(h.ticker!) ?? 0;
                const value =
                  h.market_value != null ? num(h.market_value) : h.quantity * mkt;
                const avg = num(h.avg_cost);
                const unreal =
                  h.unrealized_pnl != null
                    ? num(h.unrealized_pnl)
                    : value - h.quantity * avg;
                return (
                  <tr key={h.ticker!} className="border-b border-[var(--line)]/50">
                    <td className="py-2 pr-3 font-sans font-medium text-[var(--foreground)]">
                      {h.ticker}
                    </td>
                    <td className="py-2 pr-3">{h.quantity}</td>
                    <td className="py-2 pr-3">{avg.toFixed(2)}</td>
                    <td className="py-2 pr-3">{mkt.toFixed(2)}</td>
                    <td className="py-2 pr-3">{value.toFixed(2)}</td>
                    <td className={`py-2 ${signClass(unreal)}`}>{unreal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--muted)]">
        <span>
          Available cash{" "}
          <span className="font-mono tabular-nums text-[var(--foreground)]">
            {fmtMoney(availableCash)}
          </span>
        </span>
        <span>
          IPO blocked{" "}
          <span className="font-mono tabular-nums text-[var(--foreground)]">
            {fmtMoney(blocked)}
          </span>
        </span>
        <span>
          Portfolio value{" "}
          <span className="font-mono tabular-nums text-[var(--foreground)]">
            {fmtMoney(portfolioValue)}
          </span>
        </span>
      </div>
    </section>
  );
}

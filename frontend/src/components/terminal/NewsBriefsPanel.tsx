"use client";

import { useState } from "react";
import type { NewsItem } from "@/components/NewsPanel";

type Props = {
  news: NewsItem[];
  open?: boolean;
  onToggle?: () => void;
};

function formatTime(releasedAt?: string) {
  if (!releasedAt) return "—";
  return new Date(releasedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NewsBriefsPanel({ news, open = false, onToggle }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="border-b border-[var(--line)] bg-[var(--panel)]/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left sm:px-4 hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="font-sans text-sm font-medium text-[var(--foreground)]">
          News briefs
          <span className="ml-2 text-xs text-[var(--muted)]">({news.length} released)</span>
        </span>
        <span className="text-[var(--muted)]" aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="max-h-72 overflow-y-auto border-t border-[var(--line)] px-3 py-2 sm:px-4">
          {news.length === 0 ? (
            <p className="py-2 text-sm text-[var(--muted)]">No news released yet.</p>
          ) : (
            <ul className="space-y-2">
              {news.map((item) => {
                const isExpanded = expandedId === item.id;
                const briefs = item.brief_points ?? [];
                return (
                  <li
                    key={item.id}
                    className="rounded border border-[var(--line)] bg-[var(--background)]/40"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left hover:bg-white/[0.03]"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-[var(--muted)]">{formatTime(item.released_at)}</p>
                        <p className="mt-0.5 text-sm leading-snug text-[var(--foreground)]">
                          {item.title}
                        </p>
                      </div>
                      <span className="shrink-0 text-[var(--muted)] pt-1" aria-hidden>
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-[var(--line)] px-3 py-2">
                        {briefs.length > 0 ? (
                          <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--muted)]">
                            {briefs.map((point, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[var(--accent)]">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-[var(--muted)]">Brief not available.</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

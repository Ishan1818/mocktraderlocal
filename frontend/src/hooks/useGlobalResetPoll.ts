"use client";

import { useEffect, useRef } from "react";
import { fetchGlobalResetAt, resetLocalSimulation } from "@/lib/api";

const SEEN_KEY = "tradeverse_seen_reset_at";

/**
 * Poll Supabase event_control; when organizer bumps reset_at, reset local sim + timer.
 */
export function useGlobalResetPoll(
  enabled: boolean,
  onReset: () => void | Promise<void>,
) {
  const seenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const stored = window.localStorage.getItem(SEEN_KEY);
    if (stored) seenRef.current = stored;

    let cancelled = false;

    async function poll() {
      const resetAt = await fetchGlobalResetAt();
      if (cancelled || !resetAt) return;
      if (!seenRef.current) {
        seenRef.current = resetAt;
        window.localStorage.setItem(SEEN_KEY, resetAt);
        return;
      }
      if (resetAt !== seenRef.current) {
        seenRef.current = resetAt;
        window.localStorage.setItem(SEEN_KEY, resetAt);
        // #region agent log
        fetch("http://127.0.0.1:7751/ingest/a915aa99-33fd-43fa-bac6-36d58d56dd08", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ac2555" },
          body: JSON.stringify({
            sessionId: "ac2555",
            location: "useGlobalResetPoll.ts:poll",
            message: "global reset detected",
            data: { resetAt },
            timestamp: Date.now(),
            hypothesisId: "RESET",
          }),
        }).catch(() => {});
        // #endregion
        try {
          await resetLocalSimulation();
          await onReset();
        } catch {
          /* organizer may have reset before participant joined — ignore */
        }
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, onReset]);
}

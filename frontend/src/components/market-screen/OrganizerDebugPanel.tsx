"use client";

import { useEffect, useState } from "react";
import {
  organizerBuildParticipantZip,
  organizerFreshWipe,
  organizerResetMarket,
  organizerStopMarket,
} from "@/lib/api";
import {
  lockOrganizer,
  unlockOrganizer,
  getStoredOrganizerPasskey,
  isOrganizerUnlocked,
} from "@/lib/organizerAuth";
import { MarketScreenDebugPanel } from "@/components/market-screen/MarketScreenDebugPanel";

type DebugLine = {
  label: string;
  value: string;
  ok?: boolean;
};

type Props = {
  lines: DebugLine[];
  simulationStatus?: string;
  simulationElapsed?: string;
  onResetComplete?: () => void;
};

export function OrganizerDebugPanel({
  lines,
  simulationStatus,
  simulationElapsed,
  onResetComplete,
}: Props) {
  const [passkey, setPasskey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [zipMsg, setZipMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOrganizerUnlocked()) setUnlocked(true);
  }, []);

  function key() {
    return passkey || getStoredOrganizerPasskey();
  }

  function handleUnlock() {
    setError(null);
    if (unlockOrganizer(passkey)) {
      setUnlocked(true);
    } else {
      setError("Wrong passkey.");
    }
  }

  async function handleStop() {
    if (!unlocked) return;
    setBusy("stop");
    setResetMsg(null);
    setError(null);
    try {
      const result = await organizerStopMarket(key());
      setResetMsg(`Market stopped / paused. Status: ${String(result.status ?? "paused")}.`);
      onResetComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stop failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    if (!unlocked) return;
    if (
      !window.confirm(
        "Reset everyone's progress, price charts, and timer to 0 on all participant laptops?",
      )
    ) {
      return;
    }
    setBusy("reset");
    setResetMsg(null);
    setError(null);
    try {
      const result = await organizerResetMarket(key());
      setResetMsg(
        `Everyone's progress and charts reset. Timer at 0. Cloud signal: ${result.global_reset_signaled ? "sent" : "failed"}. Leaderboard cleared: ${result.leaderboard_cleared ? "yes" : "no"}.`,
      );
      onResetComplete?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reset failed";
      setError(
        /404/.test(msg)
          ? "Reset API not found — close TRADEVERSE and start again."
          : msg,
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleFreshWipe() {
    if (!unlocked) return;
    if (
      !window.confirm(
        "Delete this laptop's market database and clear all caches? Participants will need to rejoin. This cannot be undone.",
      )
    ) {
      return;
    }
    setBusy("wipe");
    setResetMsg(null);
    setError(null);
    try {
      const result = await organizerFreshWipe(key());
      setResetMsg(
        `Fresh wipe done. DB cleared. Signal: ${result.global_reset_signaled ? "sent" : "failed"}. Leaderboard: ${result.leaderboard_cleared ? "cleared" : "not cleared"}. Participants should rejoin.`,
      );
      onResetComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fresh wipe failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleBuildZip() {
    if (!unlocked) return;
    setBusy("zip");
    setZipMsg(null);
    setError(null);
    try {
      const result = await organizerBuildParticipantZip(key());
      setZipMsg(
        `Created ${result.zip_name ?? "Tradeverse-Participant.zip"} (${result.zip_size_mb ?? "?"} MB) at ${result.zip_path ?? "project folder"}. Share via USB, Teams, or Drive — not WhatsApp folders.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Build failed";
      setError(
        /404/.test(msg) ? "Build API not found — close TRADEVERSE and start again." : msg,
      );
    } finally {
      setBusy(null);
    }
  }

  if (!unlocked) {
    return (
      <div className="border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
        <p className="font-bold uppercase tracking-wider text-amber-400">Organizer controls</p>
        <p className="mt-2 text-amber-200/70">Passkey required. Not shown on participant terminals.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="password"
            className="min-w-[200px] rounded border border-amber-700/50 bg-black/40 px-3 py-2 text-amber-50 outline-none focus:border-amber-400"
            placeholder="Organizer passkey"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
          />
          <button
            type="button"
            className="rounded border border-amber-500/60 px-4 py-2 text-amber-100 hover:bg-amber-500/10"
            onClick={handleUnlock}
          >
            Unlock
          </button>
        </div>
        {error && <p className="mt-2 text-red-300">{error}</p>}
      </div>
    );
  }

  const disabled = busy !== null;

  return (
    <div className="space-y-4">
      <div className="border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold uppercase tracking-wider text-amber-400">Organizer controls</p>
          <button
            type="button"
            className="text-xs text-amber-300/80 underline"
            onClick={() => {
              lockOrganizer();
              setUnlocked(false);
            }}
          >
            Lock
          </button>
        </div>
        <p className="mt-2 text-amber-200/80">
          Simulation: {simulationStatus ?? "—"} · {simulationElapsed ?? "00:00:00"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            className="rounded border border-orange-500/60 bg-orange-950/40 px-4 py-2 font-medium text-orange-100 hover:bg-orange-900/40 disabled:opacity-50"
            onClick={() => void handleStop()}
          >
            {busy === "stop" ? "Stopping…" : "Stop market"}
          </button>
          <button
            type="button"
            disabled={disabled}
            className="rounded border border-red-500/60 bg-red-950/40 px-4 py-2 font-medium text-red-100 hover:bg-red-900/40 disabled:opacity-50"
            onClick={() => void handleReset()}
          >
            {busy === "reset" ? "Resetting…" : "Reset everyone's progress & charts"}
          </button>
          <button
            type="button"
            disabled={disabled}
            className="rounded border border-fuchsia-500/50 bg-fuchsia-950/40 px-4 py-2 font-medium text-fuchsia-100 hover:bg-fuchsia-900/40 disabled:opacity-50"
            onClick={() => void handleFreshWipe()}
          >
            {busy === "wipe" ? "Wiping…" : "Fresh wipe (clear DB + cache)"}
          </button>
        </div>
        <p className="mt-2 text-xs text-amber-200/60">
          Stop pauses the clock. Reset zeroes progress/charts/timer everywhere. Fresh wipe deletes the
          local database so this laptop starts clean — participants must rejoin.
        </p>

        <p className="mt-4 text-xs text-amber-200/60">
          Package excludes timeline spoilers, organizer secrets, and debug tools. Share Supabase keys
          separately.
        </p>
        <button
          type="button"
          disabled={disabled}
          className="mt-2 rounded border border-emerald-500/60 bg-emerald-950/40 px-4 py-2 font-medium text-emerald-100 hover:bg-emerald-900/40 disabled:opacity-50"
          onClick={() => void handleBuildZip()}
        >
          {busy === "zip" ? "Building zip…" : "Build participant zip (Tradeverse-Participant.zip)"}
        </button>
        {zipMsg && <p className="mt-3 text-green-300">{zipMsg}</p>}
        {resetMsg && <p className="mt-3 text-green-300">{resetMsg}</p>}
        {error && <p className="mt-2 text-red-300">{error}</p>}
      </div>
      <MarketScreenDebugPanel lines={lines} title="Organizer diagnostics" />
    </div>
  );
}

"use client";

type DebugLine = {
  label: string;
  value: string;
  ok?: boolean;
};

type Props = {
  lines: DebugLine[];
  title?: string;
  showUnlockHint?: boolean;
};

export function MarketScreenDebugPanel({ lines, title = "TRADEVERSE debug", showUnlockHint = false }: Props) {
  return (
    <div className="border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-100">
      <p className="mb-2 font-bold uppercase tracking-wider text-amber-400">{title}</p>
      {showUnlockHint && (
        <p className="mb-3 text-amber-200/70">
          Organizer passkey required on <code className="text-amber-100">/market-screen</code> (not on participant
          terminals).
        </p>
      )}
      <ul className="space-y-1 font-mono">
        {lines.map((line) => (
          <li key={line.label} className="flex flex-wrap gap-2">
            <span className="text-amber-500/80">{line.label}:</span>
            <span className={line.ok === false ? "text-red-300" : line.ok === true ? "text-green-300" : ""}>
              {line.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

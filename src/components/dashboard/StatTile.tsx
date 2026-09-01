import { DASH } from "@/lib/snapshot";

type Tone = "peak" | "good" | "neutral" | "warn" | "bad";

const TONE_TEXT: Record<Tone, string> = {
  peak: "text-peak",
  good: "text-good",
  neutral: "text-foreground",
  warn: "text-warn",
  bad: "text-bad",
};

export function StatTile({
  label,
  value,
  unit,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: Tone;
}) {
  const empty = value === DASH;
  return (
    <div className="rounded-2xl border border-border/70 bg-surface-2/50 px-4 py-3">
      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className={`num text-2xl font-semibold ${empty ? "text-muted-foreground/60" : TONE_TEXT[tone]}`}
        >
          {value}
        </span>
        {unit && !empty && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      {hint && (
        <div className="mt-1 text-[0.68rem] leading-tight text-muted-foreground/80">{hint}</div>
      )}
    </div>
  );
}

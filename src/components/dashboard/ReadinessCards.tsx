import { Link } from "@tanstack/react-router";
import type { DayProfile } from "@/lib/snapshot";
import { economyIndex, recoveryScore, supercompWindow, type ZoneState } from "@/lib/metrics";

function Ring({ value, color }: { value: number; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="size-24">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="45"
        textAnchor="middle"
        className="num"
        fill="var(--foreground)"
        fontSize="20"
        fontWeight="700"
      >
        {value}
      </text>
    </svg>
  );
}

function Bar({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="flex justify-between text-[0.65rem] text-muted-foreground">
        <span>{label}</span>
        <span className="num">{value === null ? "—" : Math.round(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-cyan"
          style={{ width: `${value === null ? 0 : Math.round(value)}%` }}
        />
      </div>
    </div>
  );
}

export function ReadinessCards({ day, states }: { day: DayProfile; states: ZoneState[] }) {
  const rec = recoveryScore(day);
  const econ = economyIndex(states);
  const win = supercompWindow(day);
  const ringColor =
    rec.score >= 65 ? "var(--lime)" : rec.score >= 45 ? "var(--amber)" : "var(--bad)";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel p-5">
        <h2 className="text-base font-semibold">Recovery score</h2>
        <p className="text-[0.7rem] text-muted-foreground">HRV · RHR · training load</p>
        <div className="mt-3 flex items-center gap-4">
          <Ring value={rec.score} color={ringColor} />
          <div className="flex-1 space-y-2">
            <div
              className="inline-block rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider"
              style={{ background: ringColor, color: "var(--background)" }}
            >
              {rec.label}
            </div>
            <Bar label="HRV" value={rec.hrvPart} />
            <Bar label="RHR" value={rec.rhrPart} />
            <Bar label="Load balance" value={rec.loadPart} />
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-base font-semibold">Economy index</h2>
        <p className="text-[0.7rem] text-muted-foreground">
          watts vs. ventilation at the same lap intensity
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span
            className="num text-5xl font-bold leading-none"
            style={{ color: (econ ?? 100) >= 100 ? "var(--lime)" : "var(--bad)" }}
          >
            {econ === null ? "—" : econ.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">/ 100 baseline</span>
        </div>
        <p className="mt-3 text-[0.75rem] leading-snug text-muted-foreground">
          {econ === null
            ? "Waiting on lap blocks."
            : econ >= 100
              ? "Same watts are costing less air than 8 weeks ago — aerobic economy improving."
              : "Same watts cost more air than 8 weeks ago — fatigue or lost economy."}
        </p>
        <Link to="/athlete" className="toy-btn mt-4 inline-block px-3 py-1.5 text-xs font-semibold">
          Edit athlete data
        </Link>
      </section>

      <section className="panel p-5">
        <h2 className="text-base font-semibold">Supercompensation window</h2>
        <p className="text-[0.7rem] text-muted-foreground">estimated peak-readiness opening</p>
        <div className="mt-4 flex items-baseline gap-2">
          <span
            className="num text-5xl font-bold leading-none"
            style={{ color: win.open ? "var(--peak)" : "var(--cyan)" }}
          >
            {win.open ? "NOW" : win.days === null ? "—" : `${win.days}d`}
          </span>
        </div>
        <p className="mt-3 text-[0.75rem] leading-snug text-muted-foreground">{win.note}</p>
        {win.confidence !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[0.65rem] text-muted-foreground">
              <span>confidence</span>
              <span className="num">{Math.round(win.confidence * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: `${Math.round(win.confidence * 100)}%` }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

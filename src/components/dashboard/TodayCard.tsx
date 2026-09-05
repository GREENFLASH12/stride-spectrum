import { useState } from "react";
import { ProfileBadge } from "./ProfileBadge";
import { StatTile } from "./StatTile";
import {
  DASH,
  PROFILE_BLURB,
  fmt,
  longDate,
  profileGroup,
  type DayProfile,
} from "@/lib/snapshot";

function tsbTone(v: number | null) {
  if (v === null) return "neutral" as const;
  if (v > 5) return "peak" as const;
  if (v < -25) return "bad" as const;
  if (v < -10) return "warn" as const;
  return "neutral" as const;
}

function hrvTone(v: number | null) {
  if (v === null) return "neutral" as const;
  if (v > 10) return "good" as const;
  if (v < -20) return "bad" as const;
  if (v < -5) return "warn" as const;
  return "neutral" as const;
}

function veTone(v: number | null) {
  if (v === null) return "neutral" as const;
  if (v < -5) return "good" as const;
  if (v > 8) return "bad" as const;
  if (v > 3) return "warn" as const;
  return "neutral" as const;
}

export function TodayCard({ day }: { day: DayProfile }) {
  const [showWhy, setShowWhy] = useState(false);
  const s = day.signals;
  const group = profileGroup(day.profile);

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Today · {longDate(day.date)}
        </span>
        <ProfileBadge profile={day.profile} size="lg" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] sm:text-4xl lg:text-5xl">
            {day.steer}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {PROFILE_BLURB[day.profile] ?? ""}
          </p>
        </div>

        {day.forecast ? (
          <div className="flex items-start gap-3 rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 lg:max-w-xs">
            <span className="mt-1 inline-block size-2 rounded-full bg-lime" />
            <div>
              <div className="text-xs font-semibold text-lime">Supercompensation window</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Opens in ~<span className="num font-semibold text-foreground">{day.forecast.days}</span> days · confidence{" "}
                <span className="num font-semibold text-foreground">{day.forecast.confidence.toFixed(1)}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-4 py-3 text-xs text-muted-foreground">
            Forecast {DASH}
          </div>
        )}
      </div>

      {day.discrepancy.conflict && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3">
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-warn text-[0.7rem] font-bold text-amber-foreground">
            !
          </span>
          <div>
            <div className="text-sm font-semibold text-warn">Signal conflict</div>
            <p className="text-sm text-muted-foreground">{day.discrepancy.verdict}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {day.discrepancy.signature.map((sig) => (
                <span
                  key={sig}
                  className="num rounded-full bg-warn/15 px-2 py-0.5 text-[0.68rem] text-warn"
                >
                  {sig}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="TSB" value={fmt(s.tsb)} hint="+ = fresh" tone={tsbTone(s.tsb)} />
        <StatTile
          label="HRV Δ"
          value={fmt(s.hrv_delta_pct)}
          unit="%"
          hint="vs baseline"
          tone={hrvTone(s.hrv_delta_pct)}
        />
        <StatTile
          label="RHR Δ"
          value={fmt(s.rhr_delta_bpm)}
          unit="bpm"
          hint="lower is better"
          tone={
            s.rhr_delta_bpm === null ? "neutral" : s.rhr_delta_bpm < -1 ? "good" : s.rhr_delta_bpm > 2 ? "warn" : "neutral"
          }
        />
        <StatTile
          label="Breathing"
          value={fmt(s.ve_at_anchor_delta_pct)}
          unit="%"
          hint="air used for the same effort"
          tone={veTone(s.ve_at_anchor_delta_pct)}
        />
        <StatTile
          label="Power"
          value={fmt(s.power_at_const_ve_delta_pct)}
          unit="%"
          hint="watts for the same breathing"
        />
        <StatTile
          label="Ride data"
          value={String(s.ve_stale_days)}
          unit={s.ve_stale_days === 1 ? "day old" : "days old"}
          hint={s.ve_stale_days > 2 ? "getting stale" : "recent"}
          tone={s.ve_stale_days > 2 ? "warn" : "neutral"}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className={`toy-btn ${showWhy ? "toy-btn-cyan" : ""}`}
        >
          {showWhy ? "Hide the why" : "Why?"}
        </button>
      </div>

      {showWhy && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {day.reasons.map((r) => (
            <li
              key={r}
              className="num rounded-xl border border-border/60 bg-surface-2/40 px-3 py-2 text-xs text-muted-foreground"
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

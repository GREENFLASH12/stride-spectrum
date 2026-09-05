import { useState } from "react";
import {
  GROUP_STYLES,
  PROFILE_LABELS,
  fmt,
  groupOf,
  longDate,
  type DayProfile,
} from "@/lib/snapshot";

export function HeatStrip({ days }: { days: DayProfile[] }) {
  const [active, setActive] = useState<DayProfile | null>(null);
  const shown = active ?? days[days.length - 1] ?? null;

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Readiness history</h2>
        <span className="text-xs text-muted-foreground">
          {days.length} days · {days[0]?.date} → {days[days.length - 1]?.date}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-[3px]">
        {days.map((d, i) => {
          const g = GROUP_STYLES[groupOf(d)];
          const isToday = i === days.length - 1;
          return (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => setActive(d)}
              onFocus={() => setActive(d)}
              onClick={() => setActive(d)}
              aria-label={`${d.date} ${d.profile}`}
              className={`size-3.5 rounded-[4px] ${g.dot} transition-transform hover:scale-125 sm:size-4 ${
                groupOf(d) === "neutral" ? "opacity-40" : "opacity-90"
              } ${isToday ? "outline-2 outline-offset-2 outline-lime" : ""} ${
                shown?.date === d.date ? "scale-125" : ""
              }`}
            />
          );
        })}
      </div>

      {shown && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-surface-2/50 px-3 py-2 text-xs">
          <span className="num text-foreground">{longDate(shown.date)}</span>
          <span className={GROUP_STYLES[groupOf(shown)].text}>
            {PROFILE_LABELS[shown.profile] ?? shown.profile}
          </span>
          <span className="num text-muted-foreground">Form {fmt(shown.signals.tsb)}</span>
          <span className="num text-muted-foreground">
            HRV {fmt(shown.signals.hrv_delta_pct)}%
          </span>
          <span className="num text-muted-foreground">
            Breathing {fmt(shown.signals.ve_at_anchor_delta_pct)}%
          </span>
        </div>
      )}
    </section>
  );
}

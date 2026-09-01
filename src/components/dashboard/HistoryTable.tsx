import { Fragment, useMemo, useState } from "react";
import { ProfileBadge } from "./ProfileBadge";
import { GROUP_STYLES, fmt, groupOf, shortDate, type DayProfile } from "@/lib/snapshot";

type Filter = "all" | "good" | "fatigue" | "conflict";

const FILTERS: { id: Filter; label: string; btn: string }[] = [
  { id: "all", label: "All days", btn: "toy-btn-cyan" },
  { id: "good", label: "Good", btn: "toy-btn-lime" },
  { id: "fatigue", label: "Fatigue", btn: "toy-btn" },
  { id: "conflict", label: "Conflict", btn: "toy-btn-amber" },
];

export function HistoryTable({ days }: { days: DayProfile[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const rows = useMemo(() => {
    const desc = [...days].reverse();
    return desc.filter((d) => {
      const g = groupOf(d);
      if (filter === "all") return true;
      if (filter === "conflict") return d.discrepancy.conflict;
      if (filter === "good") return g === "peak" || g === "good";
      return g === "bad";
    });
  }, [days, filter]);

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Day-by-day log</h2>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`toy-btn ${filter === f.id ? f.btn : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Profile</th>
              <th className="px-3 py-2 text-right font-semibold">TSB</th>
              <th className="px-3 py-2 text-right font-semibold">HRV Δ%</th>
              <th className="px-3 py-2 text-right font-semibold">VE Δ%</th>
              <th className="px-3 py-2 font-semibold">Steer</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const g = GROUP_STYLES[groupOf(d)];
              const isOpen = open === d.date;
              return (
                <Fragment key={d.date}>
                  <tr
                    className={`${g.row} align-middle transition-colors hover:bg-surface-2/60`}
                  >
                    <td className="num rounded-l-xl px-3 py-2.5 text-muted-foreground">
                      {shortDate(d.date)}
                    </td>
                    <td className="px-3 py-2.5">
                      <ProfileBadge profile={d.profile} />
                    </td>
                    <td className="num px-3 py-2.5 text-right">{fmt(d.signals.tsb)}</td>
                    <td className="num px-3 py-2.5 text-right">{fmt(d.signals.hrv_delta_pct)}</td>
                    <td className="num px-3 py-2.5 text-right">
                      {fmt(d.signals.ve_at_anchor_delta_pct)}
                    </td>
                    <td className="max-w-[22rem] truncate px-3 py-2.5 text-muted-foreground">
                      {d.steer}
                    </td>
                    <td className="rounded-r-xl px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : d.date)}
                        className="rounded-full border border-border px-2.5 py-1 text-[0.68rem] text-muted-foreground transition-colors hover:border-cyan/50 hover:text-cyan"
                      >
                        {isOpen ? "Hide" : "Why"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={7} className="rounded-xl bg-surface-2/50 px-4 py-3">
                        <ul className="num grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                          {d.reasons.map((r) => (
                            <li key={r}>· {r}</li>
                          ))}
                        </ul>
                        {d.discrepancy.conflict && (
                          <p className="mt-2 text-xs text-warn">{d.discrepancy.verdict}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing <span className="num">{rows.length}</span> of{" "}
        <span className="num">{days.length}</span> days
      </p>
    </section>
  );
}

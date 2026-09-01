import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, shortDate, type DayProfile } from "@/lib/snapshot";

type Row = {
  date: string;
  label: string;
  tsb: number | null;
  hrv: number | null;
  rhr: number | null;
  ve: number | null;
  pw: number | null;
};

function toRows(days: DayProfile[]): Row[] {
  return days.map((d) => ({
    date: d.date,
    label: shortDate(d.date),
    tsb: d.signals.tsb,
    hrv: d.signals.hrv_delta_pct,
    rhr: d.signals.rhr_delta_bpm,
    ve: d.signals.ve_at_anchor_delta_pct,
    pw: d.signals.power_at_const_ve_delta_pct,
  }));
}

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

type MetricKey = "ve" | "pw" | "hrv" | "rhr" | "tsb";

const METRICS: {
  key: MetricKey;
  name: string;
  short: string;
  color: string;
  dash?: string;
  hint: string;
}[] = [
  { key: "ve", name: "VE @ anchor %", short: "VE Δ%", color: "var(--lime)", hint: "neg = good" },
  { key: "pw", name: "W @ const VE %", short: "W Δ%", color: "var(--cyan)", dash: "4 4", hint: "power economy" },
  { key: "hrv", name: "HRV Δ%", short: "HRV Δ%", color: "#7dd3fc", hint: "recovery" },
  { key: "rhr", name: "RHR Δ bpm", short: "RHR Δ", color: "var(--amber)", hint: "neg = good" },
  { key: "tsb", name: "TSB", short: "TSB", color: "#c4b5fd", dash: "6 3", hint: "+ = fresh" },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="num text-[0.7rem] text-muted-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="num flex items-center gap-2 text-xs">
          <span className="inline-block size-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold text-foreground">
            {fmt(p.value as number | null)}
          </span>
        </div>
      ))}
    </div>
  );
}

function lastValue(data: Row[], key: MetricKey): number | null {
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][key] !== null) return data[i][key];
  }
  return null;
}

export function Charts({ days }: { days: DayProfile[] }) {
  const data = toRows(days);
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({
    ve: true,
    pw: true,
    hrv: true,
    rhr: false,
    tsb: true,
  });

  const toggle = (key: MetricKey) =>
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      // never allow zero visible metrics
      if (!Object.values(next).some(Boolean)) return v;
      return next;
    });

  const active = METRICS.filter((m) => visible[m.key]);
  const tick = { ...axis, minTickGap: 32 };

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Signal blend</h2>
          <span className="text-[0.7rem] text-muted-foreground">
            all metrics on one axis — tap the chips to blend them in or out
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          {active.map((m) => (
            <div key={m.key} className="text-right">
              <div className="num text-lg font-bold leading-none" style={{ color: m.color }}>
                {fmt(lastValue(data, m.key))}
              </div>
              <div className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                {m.short}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {METRICS.map((m) => {
          const on = visible[m.key];
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => toggle(m.key)}
              aria-pressed={on}
              className="toy-btn flex items-center gap-2 px-3 py-1.5 text-xs font-semibold"
              style={
                on
                  ? { background: m.color, borderColor: m.color, color: "#0b0e0c" }
                  : { color: m.color, opacity: 0.55 }
              }
              title={m.hint}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: on ? "#0b0e0c" : m.color }}
              />
              {m.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} vertical={false} />
            <XAxis dataKey="label" {...tick} />
            <YAxis {...axis} width={40} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            {active.map((m) => (
              <Line
                key={m.key}
                name={m.name}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={m.dash ? 1.5 : 2}
                strokeDasharray={m.dash}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

import {
  Area,
  AreaChart,
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

function Panel({
  title,
  subtitle,
  current,
  children,
}: {
  title: string;
  subtitle: string;
  current?: { label: string; value: number | null; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <span className="text-[0.7rem] text-muted-foreground">{subtitle}</span>
        </div>
        {current && (
          <div className="flex items-baseline gap-4">
            {current.map((c) => (
              <div key={c.label} className="text-right">
                <div className="num text-lg font-bold leading-none" style={{ color: c.color }}>
                  {fmt(c.value)}
                </div>
                <div className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 h-56 w-full">{children}</div>
    </section>
  );
}

export function Charts({ days }: { days: DayProfile[] }) {
  const data = toRows(days);
  const tick = { ...axis, minTickGap: 32 };
  const last = [...data].reverse().find((r) => r.ve !== null || r.pw !== null) ?? data[data.length - 1];
  const lastAuto = [...data].reverse().find((r) => r.hrv !== null || r.rhr !== null) ?? data[data.length - 1];
  const lastTsb = [...data].reverse().find((r) => r.tsb !== null) ?? data[data.length - 1];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Breathing economy"
        subtitle="negative = more economical"
        current={[
          { label: "VE Δ%", value: last.ve, color: "var(--lime)" },
          { label: "W Δ%", value: last.pw, color: "var(--cyan)" },
        ]}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} vertical={false} />
            <XAxis dataKey="label" {...tick} />
            <YAxis {...axis} width={40} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Line
              name="VE @ anchor %"
              type="monotone"
              dataKey="ve"
              stroke="var(--lime)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              name="W @ const VE %"
              type="monotone"
              dataKey="pw"
              stroke="var(--cyan)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Autonomic status" subtitle="HRV % · RHR bpm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} vertical={false} />
            <XAxis dataKey="label" {...tick} />
            <YAxis {...axis} width={40} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Line
              name="HRV Δ%"
              type="monotone"
              dataKey="hrv"
              stroke="var(--cyan)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              name="RHR Δ bpm"
              type="monotone"
              dataKey="rhr"
              stroke="var(--amber)"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <section className="panel p-5 sm:p-6 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Freshness balance (TSB)</h2>
          <span className="text-[0.7rem] text-muted-foreground">
            above zero = fresh · below = fatigued
          </span>
        </div>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="tsbFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.5} />
                  <stop offset="55%" stopColor="var(--lime)" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="var(--bad)" stopOpacity={0.18} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
              <XAxis dataKey="label" {...tick} />
              <YAxis {...axis} width={40} />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
              <Area
                name="TSB"
                type="monotone"
                dataKey="tsb"
                stroke="var(--lime)"
                strokeWidth={2}
                fill="url(#tsbFill)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

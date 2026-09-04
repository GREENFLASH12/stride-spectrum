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
import { shortDate, type DayProfile } from "@/lib/snapshot";
import {
  ZONE_LABEL,
  loadSeries,
  recoverySeries,
  zoneIndexSeries,
  type Zone,
} from "@/lib/metrics";

/* ---------- shared chart furniture ---------- */

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-popover px-3 py-2">
      <div className="num text-[0.68rem] text-muted-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="num flex items-center gap-3 text-xs">
          <span className="inline-block h-[2px] w-3" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-medium text-foreground">
            {p.value === null || p.value === undefined
              ? "—"
              : `${Math.round(p.value * 10) / 10}${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function Chip({
  on,
  color,
  label,
  onClick,
}: {
  on: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="toy-btn flex items-center gap-2 text-[0.72rem]"
      style={
        on
          ? { borderColor: color, color: "var(--foreground)" }
          : { opacity: 0.5 }
      }
    >
      <span className="inline-block h-[2px] w-3" style={{ background: color }} />
      {label}
    </button>
  );
}

function Frame({
  title,
  subtitle,
  readouts,
  controls,
  children,
}: {
  title: string;
  subtitle: string;
  readouts?: { label: string; value: string; color: string }[];
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">{title}</h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {readouts && (
          <div className="flex items-start gap-6">
            {readouts.map((r) => (
              <div key={r.label} className="text-right">
                <div className="num text-xl font-semibold leading-none" style={{ color: r.color }}>
                  {r.value}
                </div>
                <div className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {controls && <div className="mt-4 flex flex-wrap gap-2">{controls}</div>}
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const grid = (
  <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
);

const COLORS = {
  ochre: "var(--amber)",
  blue: "var(--cyan)",
  brick: "var(--bad)",
  sage: "var(--lime)",
  bone: "oklch(0.8 0.01 85)",
};

const one = (v: number | null) => (v === null ? "—" : (Math.round(v * 10) / 10).toFixed(1));

/* ---------- 1. Zone efficiency ---------- */

const ZONES: { zone: Zone; color: string }[] = [
  { zone: "endurance", color: COLORS.blue },
  { zone: "vt1", color: COLORS.sage },
  { zone: "vt2", color: COLORS.ochre },
];

type Part = "index" | "power" | "breathing" | "heartRate";
const PARTS: { key: Part; label: string; color: string }[] = [
  { key: "power", label: "Power", color: COLORS.bone },
  { key: "breathing", label: "Breathing", color: COLORS.blue },
  { key: "heartRate", label: "Heart rate", color: COLORS.brick },
];

function ZoneEfficiency() {
  const [zone, setZone] = useState<Zone>("vt1");
  const [parts, setParts] = useState<Part[]>([]);
  const series = zoneIndexSeries(zone);
  const data = series.map((p) => ({ ...p, label: shortDate(p.date) }));
  const last = series[series.length - 1];
  const zoneColor = ZONES.find((z) => z.zone === zone)!.color;

  return (
    <Frame
      title="Efficiency by zone"
      subtitle="One number per zone, built from the lap averages of every block you rode there. It rises when the same effort costs less air and fewer heartbeats. 100 = where you started."
      readouts={[
        { label: `${ZONE_LABEL[zone]} index`, value: one(last?.index ?? null), color: zoneColor },
      ]}
      controls={
        <>
          {ZONES.map((z) => (
            <button
              key={z.zone}
              type="button"
              onClick={() => setZone(z.zone)}
              aria-pressed={zone === z.zone}
              className="toy-btn text-[0.72rem]"
              style={
                zone === z.zone
                  ? { background: z.color, borderColor: z.color, color: "var(--background)" }
                  : undefined
              }
            >
              {ZONE_LABEL[z.zone]}
            </button>
          ))}
          <span className="mx-1 self-center text-[0.68rem] text-muted-foreground">break out</span>
          {PARTS.map((p) => (
            <Chip
              key={p.key}
              on={parts.includes(p.key)}
              color={p.color}
              label={p.label}
              onClick={() =>
                setParts((cur) =>
                  cur.includes(p.key) ? cur.filter((k) => k !== p.key) : [...cur, p.key],
                )
              }
            />
          ))}
        </>
      }
    >
      <LineChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        {grid}
        <XAxis dataKey="label" {...axis} minTickGap={36} />
        <YAxis {...axis} width={42} domain={["auto", "auto"]} />
        <ReferenceLine y={100} stroke="var(--border)" />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Line
          name={`${ZONE_LABEL[zone]} index`}
          type="monotone"
          dataKey="index"
          stroke={zoneColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        {PARTS.filter((p) => parts.includes(p.key)).map((p) => (
          <Line
            key={p.key}
            name={p.label}
            type="monotone"
            dataKey={p.key}
            stroke={p.color}
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </Frame>
  );
}

/* ---------- 2. Fitness / fatigue / form ---------- */

function TrainingTrend({ days }: { days: DayProfile[] }) {
  const series = loadSeries(days);
  const data = series.map((p) => ({ ...p, label: shortDate(p.date) }));
  const last = series[series.length - 1];

  return (
    <Frame
      title="Fitness, fatigue and form"
      subtitle="Long-term load builds fitness, recent load piles up fatigue, and the gap between them is your form. Form above zero means you are fresh."
      readouts={[
        { label: "Fitness", value: one(last?.fitness ?? null), color: COLORS.blue },
        { label: "Fatigue", value: one(last?.fatigue ?? null), color: COLORS.brick },
        { label: "Form", value: one(last?.form ?? null), color: COLORS.ochre },
      ]}
    >
      <LineChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        {grid}
        <XAxis dataKey="label" {...axis} minTickGap={36} />
        <YAxis {...axis} width={42} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Line name="Fitness" type="monotone" dataKey="fitness" stroke={COLORS.blue} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line name="Fatigue" type="monotone" dataKey="fatigue" stroke={COLORS.brick} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line name="Form" type="monotone" dataKey="form" stroke={COLORS.ochre} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
      </LineChart>
    </Frame>
  );
}

/* ---------- 3. Recovery ---------- */

function Recovery({ days }: { days: DayProfile[] }) {
  const [show, setShow] = useState({ hrv: false, rhr: false });
  const series = recoverySeries(days);
  const data = series.map((p) => ({ ...p, label: shortDate(p.date) }));
  const last = series[series.length - 1];

  return (
    <Frame
      title="Recovery"
      subtitle="One recovery score from heart-rate variability, resting heart rate and training load. Open the two heart signals to see what is driving it."
      readouts={[
        { label: "Recovery", value: String(last?.score ?? "—"), color: COLORS.sage },
      ]}
      controls={
        <>
          <Chip
            on={show.hrv}
            color={COLORS.blue}
            label="Heart-rate variability"
            onClick={() => setShow((s) => ({ ...s, hrv: !s.hrv }))}
          />
          <Chip
            on={show.rhr}
            color={COLORS.brick}
            label="Resting heart rate"
            onClick={() => setShow((s) => ({ ...s, rhr: !s.rhr }))}
          />
        </>
      }
    >
      <LineChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        {grid}
        <XAxis dataKey="label" {...axis} minTickGap={36} />
        <YAxis {...axis} width={42} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Line name="Recovery score" type="monotone" dataKey="score" stroke={COLORS.sage} strokeWidth={2} dot={false} isAnimationActive={false} />
        {show.hrv && (
          <Line name="HRV vs baseline %" type="monotone" dataKey="hrv" stroke={COLORS.blue} strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
        )}
        {show.rhr && (
          <Line name="Resting HR Δ bpm" type="monotone" dataKey="rhr" stroke={COLORS.brick} strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
        )}
      </LineChart>
    </Frame>
  );
}

export function Charts({ days }: { days: DayProfile[] }) {
  return (
    <section className="panel space-y-6 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold">Trends</h2>
        <p className="text-xs text-muted-foreground">
          Three views: how efficient you are in each zone, how load is stacking up, and how well
          you are recovering.
        </p>
      </div>
      <ZoneEfficiency />
      <TrainingTrend days={days} />
      <Recovery days={days} />
    </section>
  );
}

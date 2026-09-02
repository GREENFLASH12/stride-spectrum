import { ZONE_LABEL, type ZoneState } from "@/lib/metrics";

function Arrow({ dir, good }: { dir: "up" | "down" | "flat"; good: boolean }) {
  const color = dir === "flat" ? "text-muted-foreground" : good ? "text-lime" : "text-bad";
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "→";
  return <span className={`text-[0.65rem] ${color}`}>{glyph}</span>;
}

function Trend({
  label,
  now,
  prev,
  unit,
  digits = 0,
  lowerIsBetter,
}: {
  label: string;
  now: number | null;
  prev: number | null;
  unit: string;
  digits?: number;
  lowerIsBetter: boolean;
}) {
  const has = now !== null && prev !== null;
  const diff = has ? now - prev : 0;
  const dir = !has || Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "up" : "down";
  const good = lowerIsBetter ? diff < 0 : diff > 0;

  return (
    <div className="flex items-baseline justify-between gap-2 border-t border-border/60 py-1.5 first:border-t-0">
      <span className="text-[0.7rem] text-muted-foreground">{label}</span>
      <span className="num flex items-baseline gap-1.5 text-xs">
        <span className="text-muted-foreground/70">
          {prev === null ? "—" : prev.toFixed(digits)}
        </span>
        <span className="text-muted-foreground/50">→</span>
        <span className="font-semibold text-foreground">
          {now === null ? "—" : now.toFixed(digits)}
        </span>
        <span className="text-[0.6rem] text-muted-foreground">{unit}</span>
        <Arrow dir={dir} good={good} />
      </span>
    </div>
  );
}

export function ThresholdCards({ states }: { states: ZoneState[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {states.map((s) => {
        const accent =
          s.zone === "endurance" ? "var(--cyan)" : s.zone === "vt1" ? "var(--lime)" : "var(--amber)";
        const econGood = (s.costDeltaPct ?? 0) < 0;
        return (
          <div key={s.zone} className="panel p-4">
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider"
                style={{ background: accent, color: "#0b0e0c" }}
              >
                {ZONE_LABEL[s.zone]}
              </span>
              <span className="num text-[0.65rem] text-muted-foreground">{s.samples} blocks</span>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="num text-3xl font-bold leading-none" style={{ color: accent }}>
                {s.watts === null ? "—" : Math.round(s.watts)}
              </span>
              <span className="text-xs text-muted-foreground">W current</span>
            </div>

            <div className="mt-3">
              <Trend label="Watts" now={s.watts} prev={s.prevWatts} unit="W" lowerIsBetter={false} />
              <Trend label="Ventilation" now={s.ve} prev={s.prevVe} unit="L/min" digits={1} lowerIsBetter />
              <Trend label="Heart rate" now={s.hr} prev={s.prevHr} unit="bpm" lowerIsBetter />
              <Trend
                label="VE per watt"
                now={s.cost}
                prev={s.prevCost}
                unit="L/W"
                digits={3}
                lowerIsBetter
              />
            </div>

            <p className="mt-3 text-[0.7rem] leading-snug text-muted-foreground">
              {s.costDeltaPct === null
                ? "Not enough lap blocks in this zone yet."
                : econGood
                  ? `Breathing ${Math.abs(s.costDeltaPct).toFixed(1)}% cheaper per watt than 8 weeks ago — fitter and more economical.`
                  : `Breathing ${s.costDeltaPct.toFixed(1)}% more per watt than 8 weeks ago — cost of the same work is up.`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

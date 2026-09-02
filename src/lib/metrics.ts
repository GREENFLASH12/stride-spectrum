import blocksData from "../data/blocks.json";
import { profiles, type DayProfile } from "./snapshot";

export type Zone = "endurance" | "vt1" | "vt2";

export type Block = {
  zone: string;
  minutes: number;
  avg_watts: number;
  avg_ve_lmin: number;
  avg_hr_bpm: number;
};

export type Session = { date: string; blocks: Block[] };

export const sessions = (blocksData as { ftp_reference: number; sessions: Session[] }).sessions;

export const ZONE_LABEL: Record<Zone, string> = {
  endurance: "Endurance",
  vt1: "LT1 / VT1",
  vt2: "LT2 / VT2",
};

export type ZoneState = {
  zone: Zone;
  /** Recent (last 3 blocks) averages. */
  watts: number | null;
  ve: number | null;
  hr: number | null;
  /** Same, from the 8-week-ago window. */
  prevWatts: number | null;
  prevVe: number | null;
  prevHr: number | null;
  /** Ventilatory cost: litres of air per watt. Lower = more economical. */
  cost: number | null;
  prevCost: number | null;
  costDeltaPct: number | null;
  hrDelta: number | null;
  wattsDeltaPct: number | null;
  samples: number;
};

function avg(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function pick(zone: Zone, from: string, to: string) {
  const out: Block[] = [];
  for (const s of sessions) {
    if (s.date < from || s.date > to) continue;
    for (const b of s.blocks) if (b.zone === zone) out.push(b);
  }
  return out;
}

/** Current state per zone plus the trend vs. the window ~8 weeks earlier. */
export function zoneStates(days: DayProfile[] = profiles): ZoneState[] {
  const last = days[days.length - 1]?.date ?? sessions[sessions.length - 1]?.date ?? "";
  const shift = (n: number) => {
    const d = new Date(last);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };

  return (["endurance", "vt1", "vt2"] as Zone[]).map((zone) => {
    const recent = pick(zone, shift(21), last);
    const prev = pick(zone, shift(77), shift(49));

    const watts = avg(recent.map((b) => b.avg_watts));
    const ve = avg(recent.map((b) => b.avg_ve_lmin));
    const hr = avg(recent.map((b) => b.avg_hr_bpm));
    const prevWatts = avg(prev.map((b) => b.avg_watts));
    const prevVe = avg(prev.map((b) => b.avg_ve_lmin));
    const prevHr = avg(prev.map((b) => b.avg_hr_bpm));

    const cost = watts && ve ? ve / watts : null;
    const prevCost = prevWatts && prevVe ? prevVe / prevWatts : null;

    return {
      zone,
      watts,
      ve,
      hr,
      prevWatts,
      prevVe,
      prevHr,
      cost,
      prevCost,
      costDeltaPct: cost && prevCost ? ((cost - prevCost) / prevCost) * 100 : null,
      hrDelta: hr !== null && prevHr !== null ? hr - prevHr : null,
      wattsDeltaPct:
        watts !== null && prevWatts !== null ? ((watts - prevWatts) / prevWatts) * 100 : null,
      samples: recent.length,
    };
  });
}

/** Economy index: 100 = same ventilatory cost as 8 weeks ago, >100 = more economical. */
export function economyIndex(states: ZoneState[]): number | null {
  const deltas = states.map((s) => s.costDeltaPct).filter((d): d is number => d !== null);
  if (!deltas.length) return null;
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return Math.round((100 - mean) * 10) / 10;
}

export type RecoveryScore = {
  score: number;
  hrvPart: number | null;
  rhrPart: number | null;
  loadPart: number | null;
  label: string;
};

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/** 0-100 recovery score from HRV, RHR and training-load balance. */
export function recoveryScore(day: DayProfile): RecoveryScore {
  const { hrv_delta_pct: hrv, rhr_delta_bpm: rhr, tsb } = day.signals;

  const hrvPart = hrv === null ? null : clamp(50 + hrv * 1.6);
  const rhrPart = rhr === null ? null : clamp(50 - rhr * 6);
  const loadPart = tsb === null ? null : clamp(50 + tsb * 1.2);

  const parts: [number | null, number][] = [
    [hrvPart, 0.4],
    [rhrPart, 0.25],
    [loadPart, 0.35],
  ];
  const usable = parts.filter(([v]) => v !== null) as [number, number][];
  const wsum = usable.reduce((a, [, w]) => a + w, 0) || 1;
  const score = Math.round(usable.reduce((a, [v, w]) => a + v * w, 0) / wsum);

  const label =
    score >= 80 ? "primed" : score >= 65 ? "ready" : score >= 45 ? "moderate" : score >= 30 ? "strained" : "depleted";

  return { score, hrvPart, rhrPart, loadPart, label };
}

export function recoveryTrend(days: DayProfile[], n = 30) {
  return days.slice(-n).map((d) => ({
    date: d.date,
    score: recoveryScore(d).score,
  }));
}

export type WindowEstimate = {
  open: boolean;
  days: number | null;
  confidence: number | null;
  note: string;
};

/** Supercompensation window: open now, or estimated days out. */
export function supercompWindow(day: DayProfile): WindowEstimate {
  const open = day.profile === "supercompensated" || day.profile === "adapting_well";
  if (open)
    return {
      open: true,
      days: 0,
      confidence: day.forecast?.confidence ?? 0.7,
      note: "Window is open — spend it on quality intensity.",
    };
  if (day.forecast)
    return {
      open: false,
      days: day.forecast.days,
      confidence: day.forecast.confidence,
      note: `Projected to open in about ${day.forecast.days} days.`,
    };
  return {
    open: false,
    days: null,
    confidence: null,
    note: "No window projected — signals not converging yet.",
  };
}

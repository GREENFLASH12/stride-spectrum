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

/* ------------------------------------------------------------------ *
 * Series used by the charts. Everything below is derived from lap
 * averages (blocks.json) or the daily signal snapshot.
 * ------------------------------------------------------------------ */

export type ZonePoint = {
  date: string;
  /** Composite efficiency index; 100 = same as the opening baseline. */
  index: number;
  /** Sub-components, all indexed to 100 at baseline, higher = better. */
  power: number;
  breathing: number;
  heartRate: number;
};

function smooth(xs: number[], n = 3): number[] {
  return xs.map((_, i) => {
    const from = Math.max(0, i - n + 1);
    const win = xs.slice(from, i + 1);
    return win.reduce((a, b) => a + b, 0) / win.length;
  });
}

/**
 * Per-session efficiency for one zone, built from the lap averages of the
 * blocks ridden in that zone. Power indexed up, breathing and heart rate
 * indexed down (less air / fewer beats for the work = higher index).
 */
export function zoneIndexSeries(zone: Zone): ZonePoint[] {
  const raw: { date: string; w: number; ve: number; hr: number }[] = [];
  for (const s of sessions) {
    const bs = s.blocks.filter((b) => b.zone === zone);
    if (!bs.length) continue;
    const mins = bs.reduce((a, b) => a + b.minutes, 0) || 1;
    const wavg = (f: (b: Block) => number) =>
      bs.reduce((a, b) => a + f(b) * b.minutes, 0) / mins;
    raw.push({
      date: s.date,
      w: wavg((b) => b.avg_watts),
      ve: wavg((b) => b.avg_ve_lmin),
      hr: wavg((b) => b.avg_hr_bpm),
    });
  }
  if (raw.length < 2) return [];

  const base = raw.slice(0, Math.min(5, raw.length));
  const baseW = avg(base.map((r) => r.w))!;
  const baseVe = avg(base.map((r) => r.ve))!;
  const baseHr = avg(base.map((r) => r.hr))!;

  const power = smooth(raw.map((r) => (r.w / baseW) * 100));
  const breathing = smooth(raw.map((r) => (baseVe / r.ve) * (r.w / baseW) * 100));
  const heartRate = smooth(raw.map((r) => (baseHr / r.hr) * (r.w / baseW) * 100));

  return raw.map((r, i) => ({
    date: r.date,
    index: Math.round((0.45 * breathing[i]! + 0.35 * heartRate[i]! + 0.2 * power[i]!) * 10) / 10,
    power: Math.round(power[i]! * 10) / 10,
    breathing: Math.round(breathing[i]! * 10) / 10,
    heartRate: Math.round(heartRate[i]! * 10) / 10,
  }));
}

/** Latest value of the zone index, or null when there is not enough data. */
export function zoneIndexNow(zone: Zone): number | null {
  const s = zoneIndexSeries(zone);
  return s.length ? s[s.length - 1]!.index : null;
}

export type LoadPoint = { date: string; fitness: number; fatigue: number; form: number };

/**
 * Fitness / fatigue / form from daily training load.
 * Load per session = minutes × (watts / FTP)² × 100, summed over lap blocks.
 */
export function loadSeries(days: DayProfile[] = profiles): LoadPoint[] {
  const ftp = (blocksData as { ftp_reference: number }).ftp_reference || 250;
  const byDate = new Map<string, number>();
  for (const s of sessions) {
    const load = s.blocks.reduce(
      (a, b) => a + b.minutes * Math.pow(b.avg_watts / ftp, 2) * (100 / 60),
      0,
    );
    byDate.set(s.date, (byDate.get(s.date) ?? 0) + load);
  }

  let ctl = 0;
  let atl = 0;
  const out: LoadPoint[] = [];
  for (const d of days) {
    const load = byDate.get(d.date) ?? 0;
    ctl += (load - ctl) / 42;
    atl += (load - atl) / 7;
    out.push({
      date: d.date,
      fitness: Math.round(ctl * 10) / 10,
      fatigue: Math.round(atl * 10) / 10,
      form: Math.round((ctl - atl) * 10) / 10,
    });
  }
  return out;
}

export type RecoveryPoint = {
  date: string;
  score: number;
  hrv: number | null;
  rhr: number | null;
};

/** Recovery score with its autonomic inputs alongside it. */
export function recoverySeries(days: DayProfile[] = profiles): RecoveryPoint[] {
  return days.map((d) => ({
    date: d.date,
    score: recoveryScore(d).score,
    hrv: d.signals.hrv_delta_pct,
    rhr: d.signals.rhr_delta_bpm,
  }));
}

import snapshot from "../data/snapshot.json";

export type Signals = {
  tsb: number | null;
  hrv_delta_pct: number | null;
  rhr_delta_bpm: number | null;
  ve_at_anchor_delta_pct: number | null;
  power_at_const_ve_delta_pct: number | null;
  ve_stale_days: number;
};

export type DayProfile = {
  date: string;
  profile: string;
  state: string;
  reasons: string[];
  signals: Signals;
  discrepancy: { conflict: boolean; signature: string[]; verdict: string };
  steer: string;
  forecast: { days: number; confidence: number } | null;
};

export type Snapshot = {
  generated_at: string;
  athlete: string;
  engine: string;
  profiles: DayProfile[];
};

export const snap = snapshot as Snapshot;
export const profiles = snap.profiles;
export const today = profiles[profiles.length - 1];

export type Group = "peak" | "good" | "neutral" | "bad" | "warn";

export const PROFILE_LABELS: Record<string, string> = {
  supercompensated: "Supercompensated",
  adapting_well: "Adapting well",
  normal: "Normal",
  deep_fatigue: "Deep fatigue",
  functional_overreaching: "Functional overreaching",
  overreaching_metabolic_dominant: "Overreaching (metabolic)",
};

export const PROFILE_BLURB: Record<string, string> = {
  supercompensated: "Peak readiness — the window is open.",
  adapting_well: "Fitness rising, window opening.",
  normal: "Baseline. Nothing unusual in the signals.",
  deep_fatigue: "Deeply overloaded — autonomic and metabolic both down.",
  functional_overreaching: "Intentional overload, recovery not complete.",
  overreaching_metabolic_dominant: "Breathing cost elevated while HRV looks fine.",
};

export function groupOf(d: DayProfile): Group {
  if (d.discrepancy.conflict) return "warn";
  switch (d.profile) {
    case "supercompensated":
      return "peak";
    case "adapting_well":
      return "good";
    case "normal":
      return "neutral";
    default:
      return "bad";
  }
}

export function profileGroup(profile: string): Group {
  switch (profile) {
    case "supercompensated":
      return "peak";
    case "adapting_well":
      return "good";
    case "normal":
      return "neutral";
    default:
      return "bad";
  }
}

/** Tailwind-safe token classes per semantic group. */
export const GROUP_STYLES: Record<
  Group,
  { text: string; bg: string; ring: string; dot: string; row: string; cssVar: string }
> = {
  peak: {
    text: "text-peak",
    bg: "bg-peak/15",
    ring: "ring-peak/40",
    dot: "bg-peak",
    row: "bg-peak/[0.06]",
    cssVar: "var(--peak)",
  },
  good: {
    text: "text-good",
    bg: "bg-good/15",
    ring: "ring-good/40",
    dot: "bg-good",
    row: "bg-good/[0.05]",
    cssVar: "var(--good)",
  },
  neutral: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    ring: "ring-border",
    dot: "bg-neutral",
    row: "",
    cssVar: "var(--neutral)",
  },
  warn: {
    text: "text-warn",
    bg: "bg-warn/15",
    ring: "ring-warn/40",
    dot: "bg-warn",
    row: "bg-warn/[0.05]",
    cssVar: "var(--warn)",
  },
  bad: {
    text: "text-bad",
    bg: "bg-bad/15",
    ring: "ring-bad/40",
    dot: "bg-bad",
    row: "bg-bad/[0.06]",
    cssVar: "var(--bad)",
  },
};

export const DASH = "—";

export function fmt(v: number | null | undefined, digits = 1, signed = true): string {
  if (v === null || v === undefined || Number.isNaN(v)) return DASH;
  const s = v.toFixed(digits);
  return signed && v > 0 ? `+${s}` : s;
}

export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d} ${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m)]}`;
}

export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d} ${["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][Number(m)]} ${y}`;
}

export const distribution = profiles.reduce<Record<string, number>>((acc, p) => {
  acc[p.profile] = (acc[p.profile] ?? 0) + 1;
  return acc;
}, {});

export const conflictCount = profiles.filter((p) => p.discrepancy.conflict).length;

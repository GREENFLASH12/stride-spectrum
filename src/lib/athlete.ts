import { useEffect, useState } from "react";

export type AthleteProfile = {
  name: string;
  age: number | null;
  weight_kg: number | null;
  ftp_w: number | null;
  vo2max_est: number | null;
  /** Tymewear ramp test results per zone. */
  ramp: {
    endurance: RampEntry;
    vt1: RampEntry;
    vt2: RampEntry;
    vo2max: RampEntry;
  };
};

export type RampEntry = {
  watts: number | null;
  ve_lmin: number | null;
  hr_bpm: number | null;
};

export const DEFAULT_ATHLETE: AthleteProfile = {
  name: "athlete i344505",
  age: 34,
  weight_kg: 72,
  ftp_w: 285,
  vo2max_est: 61,
  ramp: {
    endurance: { watts: 175, ve_lmin: 62, hr_bpm: 128 },
    vt1: { watts: 214, ve_lmin: 88, hr_bpm: 152 },
    vt2: { watts: 262, ve_lmin: 118, hr_bpm: 172 },
    vo2max: { watts: 330, ve_lmin: 152, hr_bpm: 186 },
  },
};

const KEY = "br.athlete.v1";

export function loadAthlete(): AthleteProfile {
  if (typeof window === "undefined") return DEFAULT_ATHLETE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_ATHLETE;
    const parsed = JSON.parse(raw) as Partial<AthleteProfile>;
    return {
      ...DEFAULT_ATHLETE,
      ...parsed,
      ramp: { ...DEFAULT_ATHLETE.ramp, ...(parsed.ramp ?? {}) },
    };
  } catch {
    return DEFAULT_ATHLETE;
  }
}

export function saveAthlete(a: AthleteProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(a));
}

/** Hydration-safe athlete profile (defaults on server, stored value after mount). */
export function useAthlete() {
  const [athlete, setAthlete] = useState<AthleteProfile>(DEFAULT_ATHLETE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAthlete(loadAthlete());
    setHydrated(true);
  }, []);

  const update = (next: AthleteProfile) => {
    setAthlete(next);
    saveAthlete(next);
  };

  return { athlete, setAthlete: update, hydrated };
}

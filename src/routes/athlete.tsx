import { createFileRoute, Link } from "@tanstack/react-router";
import { useAthlete, type AthleteProfile, type RampEntry, DEFAULT_ATHLETE } from "@/lib/athlete";

export const Route = createFileRoute("/athlete")({
  head: () => ({
    meta: [
      { title: "Athlete Profile — Breathing Readiness" },
      {
        name: "description",
        content:
          "Enter weight, age, FTP and Tymewear ramp-test results (endurance, VT1, VT2, VO2max watts and ventilation) that feed the readiness engine.",
      },
      { property: "og:title", content: "Athlete Profile — Breathing Readiness" },
      {
        property: "og:description",
        content: "Your physiology inputs: weight, age, FTP and ramp-test thresholds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AthletePage,
});

function Field({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit?: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="num w-full bg-transparent text-sm font-semibold text-foreground outline-none"
        />
        {unit && <span className="text-[0.7rem] text-muted-foreground">{unit}</span>}
      </span>
    </label>
  );
}

const ZONES: { key: keyof AthleteProfile["ramp"]; label: string; color: string }[] = [
  { key: "endurance", label: "Endurance", color: "var(--cyan)" },
  { key: "vt1", label: "LT1 / VT1", color: "var(--lime)" },
  { key: "vt2", label: "LT2 / VT2", color: "var(--amber)" },
  { key: "vo2max", label: "VO2max", color: "var(--peak)" },
];

function AthletePage() {
  const { athlete, setAthlete, hydrated } = useAthlete();

  const set = (patch: Partial<AthleteProfile>) => setAthlete({ ...athlete, ...patch });
  const setRamp = (key: keyof AthleteProfile["ramp"], patch: Partial<RampEntry>) =>
    setAthlete({ ...athlete, ramp: { ...athlete.ramp, [key]: { ...athlete.ramp[key], ...patch } } });

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Athlete profile</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            General data and Tymewear ramp-test results. Everything is stored on this device and
            feeds the threshold, economy and recovery calculations.
          </p>
        </div>
        <Link to="/" className="toy-btn px-3 py-1.5 text-xs font-semibold">
          Back to dashboard
        </Link>
      </header>

      <section className="panel p-5">
        <h2 className="text-base font-semibold">General</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Age" unit="yrs" value={athlete.age} onChange={(v) => set({ age: v })} />
          <Field
            label="Weight"
            unit="kg"
            value={athlete.weight_kg}
            onChange={(v) => set({ weight_kg: v })}
          />
          <Field label="FTP" unit="W" value={athlete.ftp_w} onChange={(v) => set({ ftp_w: v })} />
          <Field
            label="Est. VO2max"
            unit="ml/kg/min"
            value={athlete.vo2max_est}
            onChange={(v) => set({ vo2max_est: v })}
          />
        </div>
        {athlete.weight_kg && athlete.ftp_w ? (
          <p className="num mt-3 text-[0.75rem] text-muted-foreground">
            {(athlete.ftp_w / athlete.weight_kg).toFixed(2)} W/kg at FTP
          </p>
        ) : null}
      </section>

      <section className="panel p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Tymewear ramp test</h2>
            <p className="text-[0.7rem] text-muted-foreground">
              watts, ventilation and heart rate at each detected threshold
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAthlete(DEFAULT_ATHLETE)}
            className="toy-btn px-3 py-1.5 text-xs font-semibold"
          >
            Reset to defaults
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {ZONES.map((z) => (
            <div key={z.key} className="rounded-2xl border border-border bg-surface/60 p-4">
              <span
                className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider"
                style={{ background: z.color, color: "var(--background)" }}
              >
                {z.label}
              </span>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field
                  label="Watts"
                  unit="W"
                  value={athlete.ramp[z.key].watts}
                  onChange={(v) => setRamp(z.key, { watts: v })}
                />
                <Field
                  label="Ventilation"
                  unit="L/min"
                  value={athlete.ramp[z.key].ve_lmin}
                  onChange={(v) => setRamp(z.key, { ve_lmin: v })}
                />
                <Field
                  label="Heart rate"
                  unit="bpm"
                  value={athlete.ramp[z.key].hr_bpm}
                  onChange={(v) => setRamp(z.key, { hr_bpm: v })}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[0.7rem] text-muted-foreground">
          {hydrated ? "Saved automatically on this device." : "Loading saved values…"}
        </p>
      </section>
    </main>
  );
}

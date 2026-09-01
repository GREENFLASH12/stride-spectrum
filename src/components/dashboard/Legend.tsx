import {
  GROUP_STYLES,
  PROFILE_BLURB,
  PROFILE_LABELS,
  conflictCount,
  distribution,
  profileGroup,
} from "@/lib/snapshot";

const ORDER = [
  "supercompensated",
  "adapting_well",
  "normal",
  "functional_overreaching",
  "overreaching_metabolic_dominant",
  "deep_fatigue",
];

export function Legend() {
  return (
    <footer className="panel p-5 sm:p-6">
      <h2 className="text-base font-semibold">Profile legend</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((p) => {
          const g = GROUP_STYLES[profileGroup(p)];
          return (
            <div key={p} className="rounded-2xl border border-border/60 bg-surface-2/40 p-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block size-2.5 rounded-full ${g.dot}`} />
                <span className={`text-sm font-semibold ${g.text}`}>{PROFILE_LABELS[p]}</span>
                <span className="num ml-auto text-xs text-muted-foreground">
                  {distribution[p] ?? 0}d
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{PROFILE_BLURB[p]}</p>
            </div>
          );
        })}
        <div className="rounded-2xl border border-warn/30 bg-warn/[0.07] p-3">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-warn" />
            <span className="text-sm font-semibold text-warn">Signal conflict</span>
            <span className="num ml-auto text-xs text-muted-foreground">{conflictCount}d</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Metabolic and autonomic signals disagree — metabolic readiness wins.
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Rule-based and fully explainable: every state above is traceable to the signals that
        produced it. No black-box scoring.
      </p>
    </footer>
  );
}

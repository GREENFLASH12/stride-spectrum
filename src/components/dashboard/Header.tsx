import { snap } from "@/lib/snapshot";

export function Header() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-lime text-lime-foreground shadow-[0_4px_0_0_oklch(0.55_0.15_130)]">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 13h4l2-6 3 12 2.5-8 1.8 4H21" />
            </svg>
          </span>
          <h1 className="text-2xl font-semibold sm:text-3xl">Breathing Readiness</h1>
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Ventilatory efficiency, overnight autonomics and training load fused into one
          explainable answer: should you train hard today?
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
        <span className="num rounded-full bg-surface-2 px-3 py-1.5 text-muted-foreground">
          {snap.athlete}
        </span>
        <span className="num rounded-full bg-cyan/15 px-3 py-1.5 text-cyan">
          engine v{snap.engine}
        </span>
        <span className="num rounded-full bg-surface-2 px-3 py-1.5 text-muted-foreground">
          generated {snap.generated_at.replace("T", " ").replace("Z", " UTC")}
        </span>
      </div>
    </header>
  );
}

import { snap } from "@/lib/snapshot";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-sm bg-amber text-amber-foreground">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 13h4l2-6 3 12 2.5-8 1.8 4H21" />
          </svg>
        </span>
        <span className="text-lg font-semibold tracking-tight">Breathing Readiness</span>
      </div>

      <div className="flex items-center gap-2 text-[0.65rem]">
        <span className="num rounded-full border border-border bg-surface px-2.5 py-1 text-muted-foreground">
          {snap.athlete}
        </span>
        <span className="num rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-cyan">
          v{snap.engine}
        </span>
      </div>
    </header>
  );
}

# Athlete Readiness Hub

I have enough understanding of the current dashboard. Now I'll write a comprehensive design tool prompt. The user will paste it into v0/Lovable together with their aesthetic directions.

The prompt needs to be self-contained:

1. **Product context** — one paragraph
2. **The data contract** — exact JSON schema with field descriptions, value ranges, nulls, so the designer can build against realistic data
3. **Real sample data** — include a few real rows (normal, supercompensated, functional_overreaching, adapting_well, discrepancy conflict) and the distribution
4. **Screens/components** — single-page dashboard with: header, today card, signals, discrepancy callout, forecast, charts (recharts), timeline table, legend/footer
5. **Interaction/state specs** — profile→color mapping, empty/missing data (—, nulls), filter states
6. **Technical constraints** — Next.js App Router, Tailwind, recharts (line/area/heatmap), one JSON import, no backend, no external fonts/network calls at runtime, static-compatible (no server-only APIs), client components where interactive
7. **Deployment constraint** — must build as static (next build works), avoid next/image remote config etc. Actually keep images unoptimized or use plain <img>/recharts.
8. **Deliverable format** — a single page.tsx (or a few components), app/ structure, Tailwind classes or CSS module.

Also important for integration:
- Keep it to files: page.tsx + maybe components/ + a lib that imports ../../data/snapshot.json
- recharts is allowed but must be installed; tell the tool to use recharts if the platform supports adding deps (v0 does).
- All charts derive from `profiles` array (dates ascending). HRV/RHR/VE deltas nullable.
- The "today" card = last element of profiles.

Profile → semantic mapping (colors to be designed, but I'll suggest semantics):
- normal (neutral)
- adapting_well (good/amber-green)
- supercompensated (best/emerald)
- deep_fatigue, functional_overreaching, overreaching_metabolic_dominant (bad/red)
- mixed signals discrepancy rows → amber/conflict

Signals display: TSB (freshness, + is good), hrv_delta_pct, rhr_delta_bpm, ve_at_anchor_delta_pct (negative = more economical = good), power_at_const_ve_delta_pct, ve_stale_days.

Discrepancy: conflict bool, signature (e.g. ["ve_bad","hrv_good"]), verdict text.

Forecast: days + confidence (0-1) — "supercomp window estimated in N days".

Steer: coaching instruction text.

I'll write the prompt as a markdown block they can copy. I should write it to a file too? The user says "Write the prompt and ill paste it in the tool". I can just output it in the chat. It's long, but that's the deliverable. Since CLI display — long content is fine when it's the requested artifact. Better: write it to a file in the repo (e.g., docs/design-tool-prompt.md) so they can copy it, AND show it. Actually outputting a huge block in chat is unwieldy; writing to a file is cleaner and they can open/copy. But they may want to copy from the chat directly. I'll write it to a file AND paste it in the chat? That duplicates. Given "You should minimize output tokens", write the file and give path + summary of sections, maybe paste the full prompt in chat since they'll copy it. Hmm.

The instruction: minimize output but the artifact is the prompt itself. I think the best UX: write to `docs/dashboard-design-prompt.md` in repo, and tell them where it is, and paste the full text in chat so they can copy immediately. But that's duplication... The user explicitly said "Write the prompt and ill paste it in the tool" — they want it in the chat to paste. I'll output it in the chat as a code block (markdown), and also save to file for reference. Actually saving to file also commits it to repo later — fine but they didn't ask. Keep it simple: output in chat. But it's long (probably 150+ lines). That's acceptable as the requested deliverable.

Hmm, but which branch? We're on session branch where app/ doesn't exist. Writing a docs file to the working tree would be on session branch — confusing. Better to just output in chat, no file. Or write file and later commit on main when integrating. I'll just output in chat — cleanest.

Let me draft the prompt carefully. Key structure:

---
# Dashboard design prompt

## Product
"Breathing Readiness" — an explainable fatigue/recovery engine for endurance cyclists. Fuses ventilatory efficiency (from Tymewear strap: liters of air per watt) with overnight HRV/RHR (Amazfit Helio) and training load (Intervals.icu CTL/ATL/TSB) to answer: *Am I fatigued, recovering, or supercompensated? Should I train hard today?* Target audience: coaches and serious amateur cyclists. This is a pitch demo for a hardware partner (Tymewear) and coaches, so it must look polished, credible, and science-grade — not like a toy.

## Deliverable
A single-page Next.js 15 App Router dashboard (React + TypeScript + Tailwind). One static page, no backend, no API calls at runtime — everything renders from one imported JSON object. Client-side interactivity only (chart hover/tooltips, filters). Must work as a fully static build.

## Data contract (exact)
TypeScript-ish schema with a full real sample... I'll embed the schema and 5-6 real rows (trim values to 1 decimal where shown).

Top-level:
```
{
  "generated_at": "2026-08-31T20:41:27Z",   // ISO timestamp
  "athlete": "athlete i344505",              // display name
  "engine": "0.1.0",                         // version badge
  "profiles": [ ... ]                        // 98 rows, ascending by date
}
```

Profile row:
```
{
  "date": "2026-08-22",        // yyyy-mm-dd
  "profile": "supercompensated", // one of: normal | adapting_well | supercompensated | deep_fatigue | functional_overreaching | overreaching_metabolic_dominant
  "state": "supercompensated",  // == profile in current data
  "reasons": ["VE@anchor -15.8%", "W@constVE -8.7%", "HRV +58.5% RHR -3.0 bpm", "TSB +11.2", "WINDOW OPEN trough -63.5 → TSB 11.2, HRV ok, VE improving"], // human-readable evidence, one line per signal
  "signals": {
    "tsb": 11.2,                 // training stress balance; + is fresh, - is fatigued
    "hrv_delta_pct": 58.5,       // % vs baseline; null = no measurement
    "rhr_delta_bpm": -3.0,       // resting HR delta; null = none
    "ve_at_anchor_delta_pct": -15.8, // ventilatory efficiency at fixed power; NEGATIVE = more economical = good
    "power_at_const_ve_delta_pct": -8.7, // power at fixed ventilation; sign convention differs
    "ve_stale_days": 3           // days since last ride-derived VE value
  },
  "discrepancy": {
    "conflict": false,           // true when autonomic & metabolic signals disagree
    "signature": [],             // e.g. ["ve_bad","hrv_good"]
    "verdict": ""                // human explanation when conflict
  },
  "steer": "supercomp window open — intensity ok, hit your target watts", // coaching instruction
  "forecast": null               // or { "days": 12, "confidence": 0.4 } — supercomp window ETA
}
```

Profile semantics + colors:
- normal (84 days): baseline, neutral
- adapting_well (5): fitness rising, supercomp window opening — good
- supercompensated (2): peak readiness — best (highlight!)
- deep_fatigue (3), functional_overreaching (2), overreaching_metabolic_dominant (2): overloaded — red
- discrepancy.conflict (37 days): metabolic vs autonomic disagree → amber warning row

Sample rows (give 5-6 real ones).

## Design requirements

### Header
Product name, tagline, athlete id + engine version + generated timestamp.

### Main: "Today" card
Most important: shows TODAY (last row). Big state badge, the steer instruction as a headline command, key signals as stat tiles (TSB, HRV Δ, RHR Δ, VE Δ, power@constVE Δ), the forecast ("estimated supercompensation window in ~N days · confidence M") when present, discrepancy alert banner when conflict, and the reasons list as small "why" chips. Missing signal → em dash.

### Charts (recharts)
4 interactive charts, all from the profiles array, x = date:
1. VE efficiency trend (ve_at_anchor_delta_pct over time, line) — maybe include power_at_const_ve as second line
2. HRV & RHR (hrv_delta_pct and rhr_delta_bpm, dual line)
3. TSB (fitness-fatigue balance, area chart, zero baseline)
4. Readiness timeline: colored band/heatmap of profile per day (strip of colored cells) — a mini calendar-style overview

Design choice freedom for aesthetics but must stay scannable. Tooltips on hover. Handle nulls gracefully.

### Timeline table
Full history, sortable/filterable by profile group (All / Good / Fatigue / Conflict), columns: date, profile badge, key signals (TSB, HRV, VE), steer, reasons expandable. Color rows by profile group.

### Footer
Legend explaining the 6 profiles + a one-line "rule-based, explainable" note.

## Technical constraints (non-negotiable)
- Next.js 15 App Router, single page at app/page.tsx (+ app/layout.tsx)
- Tailwind CSS (v4 or v3 — whatever the platform defaults to)
- Import data as `import snapshot from "../data/snapshot.json"` — keep this import path (we integrate into existing repo)
- recharts for charts (works client-side); if the platform has an equivalent, still prefer recharts
- No server components that fetch, no env vars, no API routes, no external images/fonts — must build statically
- Use only locally available data; everything rendered from the JSON
- Components split into reasonable files (components/*.tsx) so we can integrate piecemeal
- No next/image remote config; images unoptimized or plain <img> if any
- Do NOT rename/re-shape the JSON; if you need derived data, compute it in the component

## Success criteria
- One glance answers: "should I train hard today?"
- The supercompensated days visually pop (they're the money shot for the pitch)
- Fatigue days feel obviously different from good days
- Looks credible for a B2B pitch to a hardware company

---

I'll also add a note to the user: paste their aesthetic directions at the end (the tool lets them add design style); and mention constraints they should tell the tool (dark/light, color scheme).

I think embedding the real sample rows is key. Let me include 4-5 real rows (trimmed).

Also, should charts use recharts? The user's design tool (v0) supports recharts natively. Lovable too. Fine.

Length: it'll be long-ish but this is the requested artifact. Let me write it compactly with tight formatting to keep it pasteable. I'll output in chat in a fenced code block so they can copy verbatim. I'll keep schema fields concise.

One more thing: mention that profile colors should be consistent between table, chart band, and today card. Provide suggested semantic palette but let their aesthetic direction override: good/emerald, warn/amber, bad/red, neutral/slate.

Also the mini heatmap strip: 98 days — render as a row of tiny cells colored by profile, with a marker for today. That's a nice visual for the readiness_timeline replacing the PNG.

Also: allow them to add polish like card shadows, monospace numbers, etc.

Write the final prompt now. Keep the JSON sample rows trimmed to 1 decimal to avoid noisy floats.

Also add at top: "Paste this whole block into the tool, then append your aesthetic direction at the end."

I'll present it as: the prompt block, then a one-line instruction that they can append aesthetics. Keep my own commentary minimal.

Here's the full prompt — paste everything between the fences into the design tool, then append your aesthetic directions (palette, dark/light, typography vibe) right after it:

```text
# Breathing Readiness — Athlete Dashboard (pitch demo)

## Product
A single-page dashboard for an explainable fatigue/recovery engine for endurance cyclists.
It fuses ventilatory efficiency (liters of air per watt, from a wearable breathing strap),
overnight HRV/RHR (from a smartwatch), and training load (CTL/ATL/TSB from a training
platform) to answer one question per day: **"Am I fatigued, recovering, or supercompensated —
should I train hard today?"**

This is a B2B pitch demo for a hardware partner (Tymewear) and for coaches. It must look
polished, credible, and science-grade — premium dashboards (Strava, Intervals.icu,
Whoop) as reference, not a toy. Every state shown must be traceable to the signals that
produced it ("rule-based, fully explainable").

## Deliverable
A single-page **Next.js 15 App Router** dashboard (React + TypeScript + Tailwind CSS).
One static page. **No backend, no API calls, no env vars, no external images or fonts at
runtime** — everything renders from ONE imported JSON object. Client-side interactivity
only (tooltips, filters). Must compile with `next build` as a static site.

## Data contract (exact — do not rename or reshape it)

```ts
type Snapshot = {
  generated_at: string;          // ISO timestamp
  athlete: string;               // display name, e.g. "athlete i344505"
  engine: string;                // version, e.g. "0.1.0"
  profiles: DayProfile[];        // chronological (oldest → newest); "today" = LAST element
};

type DayProfile = {
  date: string;                  // "yyyy-mm-dd"
  profile: string;               // one of the 6 below
  state: string;                 // == profile in current data
  reasons: string[];             // human-readable evidence lines, one per signal
  signals: {
    tsb: number | null;                 // training stress balance; + = fresh, − = fatigued
    hrv_delta_pct: number | null;       // HRV % vs baseline
    rhr_delta_bpm: number | null;       // resting HR delta
    ve_at_anchor_delta_pct: number | null;      // ventilatory efficiency at fixed power; NEGATIVE = more economical = GOOD
    power_at_const_ve_delta_pct: number | null; // power at fixed ventilation
    ve_stale_days: number;              // days since last ride-derived value
  };
  discrepancy: {
    conflict: boolean;           // true when autonomic + metabolic signals disagree
    signature: string[];         // e.g. ["ve_bad","hrv_good"]
    verdict: string;             // human explanation ("" when no conflict)
  };
  steer: string;                 // coaching instruction for the day
  forecast: { days: number; confidence: number } | null; // supercompensation window ETA
};
```

**Profiles (6)** — define a clear semantic color for each and use it CONSISTENTLY across
the today card, charts, and table:
- `normal` — baseline, neutral
- `adapting_well` — fitness rising, window opening (good)
- `supercompensated` — PEAK readiness (best; this is the "money shot" of the pitch — make it pop)
- `deep_fatigue` / `functional_overreaching` / `overreaching_metabolic_dominant` — overloaded (bad)
- Rows where `discrepancy.conflict === true` — metabolic vs autonomic disagree (amber/warning)

Suggested palette (overridable by aesthetic direction): emerald for peak, slate for normal,
red for fatigue, amber for conflict. Missing values display as "—" (em dash).

**Real sample rows** (from the actual engine — display values to 1 decimal):

```json
{ "date": "2026-08-22", "profile": "supercompensated",
  "reasons": ["VE@anchor -15.8%", "W@constVE -8.7%", "HRV +58.5% RHR -3.0 bpm", "TSB +11.2", "WINDOW OPEN trough -63.5 → TSB 11.2, HRV ok, VE improving"],
  "signals": { "tsb": 11.2, "hrv_delta_pct": 58.5, "rhr_delta_bpm": -3.0, "ve_at_anchor_delta_pct": -15.8, "power_at_const_ve_delta_pct": -8.7, "ve_stale_days": 3 },
  "discrepancy": { "conflict": false, "signature": [], "verdict": "" },
  "steer": "supercomp window open — intensity ok, hit your target watts", "forecast": null }

{ "date": "2026-08-08", "profile": "functional_overreaching",
  "reasons": ["VE@anchor +5.2%", "W@constVE -3.7%", "HRV -35.5% RHR +2.3 bpm", "TSB -36.2", "RECOVERY but HRV still suppressed; TSB -36.2"],
  "signals": { "tsb": -36.2, "hrv_delta_pct": -35.5, "rhr_delta_bpm": 2.3, "ve_at_anchor_delta_pct": 5.2, "power_at_const_ve_delta_pct": -3.7, "ve_stale_days": 1 },
  "discrepancy": { "conflict": false, "signature": [], "verdict": "" },
  "steer": "no intensity today — easy Z1/endurance cap ~65% FTP", "forecast": { "days": 12, "confidence": 0.4 } }

{ "date": "2026-07-28", "profile": "adapting_well",
  "reasons": ["VE@anchor -20.5%", "W@constVE +12.5%", "HRV +26.1% RHR -10.3 bpm", "TSB -44.9", "WINDOW OPEN trough -56.0 → TSB -44.9, HRV ok, VE improving"],
  "signals": { "tsb": -44.9, "hrv_delta_pct": 26.1, "rhr_delta_bpm": -10.3, "ve_at_anchor_delta_pct": -20.5, "power_at_const_ve_delta_pct": 12.5, "ve_stale_days": 0 },
  "discrepancy": { "conflict": false, "signature": [], "verdict": "" },
  "steer": "supercomp window open — intensity ok, hit your target watts", "forecast": null }

{ "date": "2026-08-10", "profile": "normal",
  "reasons": ["VE@anchor +9.8%", "W@constVE -5.4%", "HRV +7.7% RHR -6.3 bpm", "TSB -25.2", "RECOVERY HRV ok, VE not yet reversing; TSB -25.2"],
  "signals": { "tsb": -25.2, "hrv_delta_pct": 7.7, "rhr_delta_bpm": -6.3, "ve_at_anchor_delta_pct": 9.8, "power_at_const_ve_delta_pct": -5.4, "ve_stale_days": 0 },
  "discrepancy": { "conflict": true, "signature": ["ve_bad","hrv_good"], "verdict": "mixed signals — prioritize metabolic readiness." },
  "steer": "mixed signals — keep Z2 capped at ~65% FTP, no threshold/VO2", "forecast": { "days": 2, "confidence": 0.5 } }
```

Distribution in the real dataset (98 days): normal ×84, adapting_well ×5, deep_fatigue ×3,
functional_overreaching ×2, supercompensated ×2, overreaching_metabolic_dominant ×2;
37 days have discrepancy conflicts. The two supercompensated days are 2026-08-22
(peak: VE −15.8%, HRV +58.5%, TSB +11.2).

## Sections (top → bottom)

1. **Header** — product name, one-line tagline, athlete id + engine version + "generated" timestamp.
2. **Today card** (most important, must be readable in 3 seconds):
   - Big profile badge ("supercompensated" / "functional_overreaching" / …) with its color
   - The `steer` line as the headline coaching command
   - Stat tiles: TSB, HRV Δ%, RHR Δ bpm, VE Δ% (note the inverted sign: negative = good),
     Power@constVE Δ%, VE stale days
   - When `forecast` is present: "Supercompensation window estimated in ~N days · confidence M"
   - When `discrepancy.conflict`: a clear amber alert with the `verdict`
   - The `reasons[]` lines as a collapsible "Why?" list
3. **Readiness heat strip** — a full-width row of 98 small cells (one per day, colored by
   profile, chronological), today highlighted with a marker. This gives the 10-second
   "training history" story arc.
4. **Charts (interactive, recharts)** — all x = date:
   - VE efficiency: `ve_at_anchor_delta_pct` line + `power_at_const_ve_delta_pct` line
   - HRV / RHR: `hrv_delta_pct` + `rhr_delta_bpm` (dual lines)
   - TSB: area chart with zero baseline
   - Tooltips on hover; nulls skipped gracefully
5. **History table** — all days, filter chips (All / Good / Fatigue / Conflict), columns:
   date, profile badge, TSB, HRV Δ, VE Δ, steer, expandable reasons. Row tinted by group.
6. **Footer** — legend of the 6 profiles with colors + "rule-based, fully explainable" note.

## Technical constraints (non-negotiable)
- Next.js 15 App Router: `app/page.tsx` + `app/layout.tsx`, components in `components/`
- Tailwind CSS
- Data import MUST be: `import snapshot from "../data/snapshot.json"` (I'll wire it into the
  existing repo — keep this exact relative path)
- recharts for all charts
- No API routes, no server fetching, no environment variables, no `next/image` remote
  config, no runtime network calls — must compile to a static export
- Split into small, sensible components so I can integrate them one by one
- Don't reshape the JSON; compute any derived values in the component

## Success criteria
- One glance answers "should I train hard today?"
- The supercompensated peak days visually pop (this is the pitch)
- Fatigue days are unmistakably different from good days
- Looks like a credible B2B sports-science product, not a hobby project
```

After you paste that, add your aesthetic direction (e.g. "dark mode, electric-lime accent on near-black, Inter tight spacing, Whoop/Strava vibes", or whatever you have in mind) and generate. When it's done, export the code and I'll integrate it into the repo — wiring the exact `../data/snapshot.json` import and keeping the Vercel build green.



As the design direction i would like you to make it a darkscreen clean aesthetic website that uses yellow green and blue objects to make it look like a toy for example buttons. Try to make the Graphs so that they blend with the background

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stride-spectrum.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/686dcf0a-82c0-4461-96b7-4da67e15e2ab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

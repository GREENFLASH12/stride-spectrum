# Polish pass: clearer numbers, three focused graphs, Bauhaus-calm look

## What changes

### 1. Plain language everywhere
Retire the jargon labels ("VE @ anchor %", "W @ const VE %", "power at constant ventilation"). Every number gets a short human name and a one-line meaning:

- "Efficiency" instead of ventilation-at-anchor
- "Power" and "Breathing" instead of watts / VE deltas
- "Heart rate" instead of HR at anchor

Each zone card (Endurance, LT1, LT2) keeps its current values plus the 8-weeks-ago comparison, but the wording becomes one sentence a reader understands without a glossary.

### 2. Three graphs, each with one job

**Graph A — Zone efficiency index**
One line per zone (Endurance, LT1, LT2), each an index over time built from the lap averages: how power, breathing and heart rate move together at that intensity. Index rises when you hold the same effort with less breathing and lower heart rate. Buttons switch which zone is shown, and a secondary set of buttons breaks the index apart into its three parts (power / breathing / heart rate) inside the same chart.

**Graph B — Fitness, fatigue and form**
The classic training-load view: fitness (long-term load), fatigue (short-term load) and form (the balance between them), on one chart with a zero line for form.

**Graph C — Recovery**
Recovery score as the main line, with buttons to reveal heart-rate variability and resting heart rate as separate lines in the same chart.

All three sit in one section below the profile cards, sharing the same frame, spacing and legend style.

### 3. Calmer Bauhaus-style look
- Softer, deeper palette: muted ochre, deep blue, brick red and warm off-white on a dark charcoal ground — no neon lime or electric cyan.
- Drop the 3-D "toy" button shadows and glow effects; flat shapes, thin rules, generous whitespace, strong type hierarchy.
- Charts blend into the background: no filled panels behind them, hairline grid, single-weight lines.
- Fewer coloured chips and pills; colour used only to distinguish data series and to flag a real warning.

## Technical notes

- New color tokens in `src/styles.css`; replace `--lime` / `--cyan` / `--amber` values and drop the glow/toy shadow tokens. `toy-btn` becomes a flat pill variant so no component markup breaks.
- `src/lib/metrics.ts` gains a `zoneIndexSeries(zone)` helper that walks `blocks.json` sessions chronologically and produces, per session, a normalized index plus the three raw components, all from lap averages.
- Fitness / fatigue / form derived from the existing daily TSB signal in `snapshot.json` (fitness = long EMA, fatigue = short EMA, form = difference).
- `Charts.tsx` rewritten into three sibling chart components sharing one axis/tooltip/legend module.
- `ThresholdCards.tsx`, `ReadinessCards.tsx`, `StatTile.tsx`, `TodayCard.tsx` get copy and styling updates only — no logic changes.

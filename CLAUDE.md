# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Type-check (tsc) then bundle (vite build)
npm run preview    # Preview the production build
npx tsc --noEmit  # Type-check only, no output = no errors
```

There are no tests. No linter is configured.

## Environment

Requires `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

The URL must **not** include `/rest/v1/`. Vite requires a server restart after changing `.env.local`.

## Architecture

This is a single-page jsPsych v8 experiment (no router, no framework). `src/main.ts` is the entire entry point: it reads `?condition=A` or `?condition=B` from the URL, builds a flat `timeline` array, and calls `jsPsych.run(timeline)`.

### Experiment flow (in order)

1. **Consent explanation** — `buildConsentTrial()` (read-only, PDF download link)
2. **Consent form** — `buildConsentFormTrial()` (saves to Supabase on submit)
3. **Instructions** — `buildInstructionTrials(condition)` (extra slide for Condition B)
4. **Practice block** — `buildSartBlock(..., 'practice', ...)` → `buildPracticeResultTrial()`
5. **Test blocks × 3** — `buildBlockStartTrial()` → `buildSartBlock(..., 'test', ...)` → `buildBreakTrial()`
6. **Questionnaires** — `buildImiTrial()` → `buildNasaTlxTrial()`
7. **End screen** — inline in `main.ts`

All trial functions in `src/experiment/` return plain objects or arrays of plain objects accepted by jsPsych's `timeline`. None are jsPsych plugins themselves.

### Condition A vs B

The only difference is in `buildSartBlock` (`src/experiment/sart.ts`): when `condition === 'B'`, it mounts the HUD and overlay at block start, calls `calcFeedback` + `updatePoints` + `showFeedback` on each trial's `on_finish`, and unmounts at block end. Condition A runs the same trial logic without any of that.

### SART trial structure

Each trial produces three jsPsych trials pushed onto the block's array:
1. Fixation (`+`, 500 ms, no response)
2. Digit stimulus (250 ms, space accepted but `response_ends_trial: false`)
3. Mask (900 ms, space accepted, `on_finish` reads back the stimulus trial via `jsPsych.data.get().last(2)` to determine actual response/RT)

`collectedTrials: TrialData[]` is accumulated in `main.ts` and bulk-saved to Supabase in `jsPsych`'s `on_finish` callback.

### jsPsych v8 gotchas

- `button_html` must be a **function** `(choice: string) => string`, not a string/array.
- `on_finish` is **not awaited** — async Supabase calls inside `on_finish` run fire-and-forget. The consent form works around this with a capture-phase click listener that saves form values to a `captured` closure variable before jsPsych clears the DOM.
- The participant ID is passed as a **getter** `() => participantId` everywhere (not the value itself) because `participantId` is assigned asynchronously in `buildConsentFormTrial`'s `on_finish`.

### Supabase tables

| Table | When saved |
|-------|-----------|
| `participants` | Consent form submit |
| `consent_forms` | Consent form submit |
| `trials` | `jsPsych.on_finish` (batched in 100-row chunks) |
| `questionnaire_responses` | `jsPsych.on_finish` |

RLS is **disabled** on all four tables (workaround for incompatibility between `sb_publishable_` keys and Supabase's `anon` RLS role).

### Gamification (Condition B only)

- `src/gamification/state.ts` — pure functions: `createGamificationState`, `calcFeedback`, `updatePoints`
- `src/gamification/hud.ts` — mounts/unmounts/updates a fixed `#sart-hud` bar appended to `document.body`
- `src/gamification/overlay.ts` — shows per-trial feedback badges via CSS animation

### Styling

Three CSS files imported in `main.ts`:
- `styles/base.css` — resets and jsPsych element centering (`min-height: 100dvh; display: flex; justify-content: center`)
- `styles/experiment.css` — trial UI (consent layout, instruction boxes, stimuli, break screen, questionnaires)
- `styles/gamification.css` — HUD bar and feedback overlay

The consent pages use `css_classes: 'trial-consent'` to trigger scoped overrides in `experiment.css` via `:has(.trial-consent)` selectors.

### All experiment parameters

Defined in `src/config/experiment.ts` as a single `EXPERIMENT_CONFIG` const. Edit there to change timings, digit counts, point thresholds, etc.

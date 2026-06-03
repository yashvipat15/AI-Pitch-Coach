# AI Pitch Coach — Person 3 (UI, Charts & Demo)

Vite + React (SWC) + Chart.js, with `prop-types` validating every component boundary.
This repo is the **UI shell + integration surface** for Person 1 (audio/Whisper) and Person 2 (Claude scoring).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Append `?demo=1` to the URL (or click **Load demo**) to seed a sample transcript and score report —
useful for live demo and for testing the UI without Person 1/2 wired up yet.

```
http://localhost:5173/?demo=1
```

## Stack

- **Vite 5** with `@vitejs/plugin-react-swc` (SWC, no Babel).
- **React 18** (`StrictMode`, hooks, function components only).
- **prop-types 15** validating every cross-component boundary — see `src/contracts.js`.
- **chart.js 4** + **react-chartjs-2 5** for the radar chart.
- Vanilla CSS with design tokens in `src/styles/index.css` — no runtime CSS-in-JS.

## File tree

```
src/
├── main.jsx              # React root
├── App.jsx               # Top-level state machine (phase, transcript, scoreReport)
├── contracts.js          # PropTypes shapes + phase enum shared with Person 1 / Person 2
├── fixtures.js           # MOCK_TRANSCRIPT + MOCK_SCORE_REPORT
├── components/
│   ├── Header.jsx        # Brand + overall score chip
│   ├── DemoControls.jsx  # Start / Stop / Reset / Load demo
│   ├── StatusBadge.jsx   # Phase indicator
│   ├── TranscriptPanel.jsx  # <- integration point for Person 1
│   ├── Scorecard.jsx     # <- integration point for Person 2
│   ├── RadarChart.jsx    # Chart.js radar over 6 categories
│   ├── FeedbackList.jsx  # Strengths + improvements columns
│   └── EmptyState.jsx
└── styles/               # Global tokens + App layout
```

## The data contract (Person 1 <-> 2 <-> 3)

Per Emmanuel: "Agree on the data format in the first 15 minutes."
The shapes live in `src/contracts.js` so all three of us import the same source of truth.

### Person 1 -> Person 3: `Transcript`

```js
{
  text: "full concatenated transcript text",      // string, required
  segments: [
    {
      id: "s1",         // string, required
      text: "...",      // string, required
      startSec: 0.0,    // number, required
      endSec: 7.2,      // number, required
    },
  ],
  finalizedAt: "2026-06-02T19:00:00.000Z",        // ISO-8601, optional (null while live)
}
```

Person 1 streams segments into `App` state. The simplest integration is to call the App's
`setTranscript` setter (passed down through `TranscriptPanel` as `onTranscriptUpdate`) every time
a segment is added.

### Person 2 -> Person 3: `ScoreReport`

```js
{
  overall: 82,                                    // 0-100, required
  categories: [
    {
      key: "clarity",          // clarity|confidence|pacing|structure|engagement|persuasiveness
      label: "Clarity",
      score: 8.5,              // 0.0 - 10.0
      rationale: "Product, user, and value stated in first sentence.",
    },
    // ...exactly 6 entries in the order above (radar chart depends on this)
  ],
  strengths:    ["string", ...],                  // any length
  improvements: ["string", ...],                  // any length
  generatedAt:  "2026-06-02T19:00:05.000Z",       // ISO-8601, required
}
```

Person 2 should hand the parsed JSON to `App.handleScoreReport(report)`. Currently exposed via
the App-level `setScoreReport` setter and the `onReceiveReport` prop on `Scorecard`.

### Phase machine

`src/contracts.js` exports `PHASES`:

```
idle -> recording -> transcribing -> scoring -> complete
                                            \-> error (terminal until reset)
```

`StatusBadge` shows the live phase label; `EmptyState` shows phase-aware copy until scores arrive.

## Wiring Person 1 (audio / Whisper)

Person 1 owns mic capture and Whisper streaming. Hook into `App.jsx`:

```js
// inside handleStart() - kick off Person 1's recorder
audioModule.start({
  onSegment: (segment) => setTranscript((prev) => ({
    ...prev,
    text: prev.text + ' ' + segment.text,
    segments: [...prev.segments, segment],
  })),
  onError: (msg) => handleError(msg),
});

// inside handleStop() - finalize and hand off to Person 2
audioModule.stop().then((finalTranscript) => {
  setTranscript(finalTranscript);
  setPhase(PHASES.SCORING);
  return scoringModule.score(finalTranscript);
}).then(handleScoreReport).catch((e) => handleError(e.message));
```

## Wiring Person 2 (Claude scoring)

Person 2 owns the Claude API call and JSON parsing. Expected signature:

```js
scoringModule.score(transcript) // Promise<ScoreReport>
```

Validate the parsed JSON against `ScoreReportShape` (PropTypes does this at runtime in dev when
you pass it through any of our components).

## Demo script (90-second live demo)

1. **Open the app cold** (`/`). One sentence: "I built the UI shell — recording controls, transcript stream, scorecard, radar."
2. **Click "Load demo"**. Walk through what just rendered:
   - Header chip jumps from `—` to `82/100` (animated tier color).
   - Radar fills across all six categories.
   - Scorecard rows reveal rationale + colored bars.
   - Coach notes split into "What worked" vs "What to fix next".
3. **Click Reset -> Start pitch**. Talk for ~20 seconds (Person 1's mic capture fills the transcript live).
4. **Click "Stop & score"**. StatusBadge advances `recording -> transcribing -> scoring -> complete` as Person 2 returns the JSON.
5. **Land on**: "The contract is the product — six categories, 0–10, with rationale. Anything that fits the shape, scores."

If anything is flaky live, fall back to `?demo=1` — the seeded fixtures look identical to the real flow.

## Notes for teammates

- Don't fight the shape — if Claude returns a different category set, extend `SCORE_CATEGORY_KEYS` in `contracts.js`. The radar relabels itself automatically.
- `clampScore()` keeps the radar safe if Claude returns 11 or -2.
- `?demo=1` is the safety net for the demo — don't remove it.

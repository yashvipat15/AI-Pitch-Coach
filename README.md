# AI Pitch Coach — Scoring Engine

`scoring.js` exposes a single async function that sends a founder's pitch transcript to Claude and returns a structured VC scorecard.

## Quick start

```bash
# 1. Install
npm install

# 2. Add your key
cp .env.example .env
# edit .env → ANTHROPIC_API_KEY=sk-ant-...

# 3. Smoke-test with the built-in demo pitch
npm test
```

## API

```js
import { scorePitch } from './scoring.js';

const result = await scorePitch(transcript);
```

### `scorePitch(transcript)` → `Promise<Scorecard>`

| Field | Type | Description |
|---|---|---|
| `problem_clarity` | `DimScore` | How crisply the problem is stated |
| `solution_strength` | `DimScore` | Strength and differentiation of the solution |
| `market_size` | `DimScore` | TAM/SAM credibility |
| `traction` | `DimScore` | Evidence of real-world pull |
| `team_credibility` | `DimScore` | Relevant background and unfair advantages |
| `ask_clarity` | `DimScore` | Clarity of the raise amount and use of funds |
| `overall_score` | `number (1-10)` | Weighted average |
| `investor_verdict` | `"Pass" \| "Maybe" \| "Strong Interest" \| "Term Sheet"` | VC verdict |
| `top_strength` | `string` | Single most compelling aspect |
| `biggest_gap` | `string` | The one thing that would stop a check |
| `memorable_line` | `string` | The sentence that sticks with an investor |

**`DimScore` object:**

```ts
{
  score:              number;  // 1–10
  one_line_rationale: string;  // why this score
  improved_version:   string;  // rewrite of the relevant section
  vc_question:        string;  // the tough question a VC would ask
}
```

## Model

`claude-sonnet-4-20250514` with `cache_control: ephemeral` on the system prompt, enabling prompt caching on repeated calls.

## Error handling

- Missing or empty transcript → `TypeError`
- Missing API key → `Error` with setup instructions
- API network/auth failure → `Error` wrapping the SDK error message
- Claude returns non-JSON → `Error` with the raw response (first 500 chars) for debugging

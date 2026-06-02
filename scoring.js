/**
 * scoring.js
 *
 * scorePitch(transcript) — calls Claude claude-sonnet-4-20250514 and returns a
 * structured VC scorecard for the given pitch transcript.
 *
 * Usage (Node ≥ 18, ES modules):
 *   import { scorePitch } from './scoring.js';
 *   const result = await scorePitch("We're building ...");
 *
 * Requires ANTHROPIC_API_KEY in a .env file or as an environment variable.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Load .env without requiring the dotenv package ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(envPath = join(__dirname, '.env')) {
  try {
    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    // .env absent — rely on process.env (CI / Docker / Render)
  }
}

loadEnv();

// ── Constants ──────────────────────────────────────────────────────────────
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT =
  'You are a battle-hardened VC who has seen 10,000 pitches. ' +
  'Score this pitch on 6 dimensions (1-10): problem_clarity, solution_strength, ' +
  'market_size, traction, team_credibility, ask_clarity. ' +
  'For each return: score, one_line_rationale, improved_version, and vc_question. ' +
  'Also return overall_score, investor_verdict (Pass/Maybe/Strong Interest/Term Sheet), ' +
  'top_strength, biggest_gap, memorable_line. ' +
  'Respond ONLY in valid JSON.';

// Expected shape for reference / consumers
export const RESULT_SHAPE = {
  problem_clarity:   { score: 0, one_line_rationale: '', improved_version: '', vc_question: '' },
  solution_strength: { score: 0, one_line_rationale: '', improved_version: '', vc_question: '' },
  market_size:       { score: 0, one_line_rationale: '', improved_version: '', vc_question: '' },
  traction:          { score: 0, one_line_rationale: '', improved_version: '', vc_question: '' },
  team_credibility:  { score: 0, one_line_rationale: '', improved_version: '', vc_question: '' },
  ask_clarity:       { score: 0, one_line_rationale: '', improved_version: '', vc_question: '' },
  overall_score:     0,
  investor_verdict:  '',
  top_strength:      '',
  biggest_gap:       '',
  memorable_line:    '',
};

// ── scorePitch ─────────────────────────────────────────────────────────────
/**
 * Score a pitch transcript using Claude.
 *
 * @param {string} transcript  The pitch text to score.
 * @returns {Promise<typeof RESULT_SHAPE>}  Parsed scorecard object.
 * @throws {Error}  If the API key is missing, the request fails, or Claude
 *                  returns malformed JSON (includes raw response for debugging).
 */
export async function scorePitch(transcript) {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    throw new TypeError('transcript must be a non-empty string');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. ' +
      'Add it to a .env file (see .env.example) or export it as an environment variable.'
    );
  }

  const client = new Anthropic({ apiKey });

  let message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      // cache_control marks the system prompt for prompt caching.
      // Claude will cache this block once it hits the token minimum (~1 024 tokens
      // for Sonnet), reducing latency and cost on repeated calls.
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: transcript.trim() }],
    });
  } catch (apiErr) {
    throw new Error(`Anthropic API request failed: ${apiErr.message}`);
  }

  const rawText = message.content?.[0]?.text ?? '';

  // Strip optional markdown code fences Claude sometimes wraps JSON in
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    throw new Error(
      `Claude returned non-JSON content. ` +
      `Parse error: ${parseErr.message}\n\n` +
      `Raw response (first 500 chars):\n${cleaned.slice(0, 500)}`
    );
  }
}

// ── CLI smoke-test ─────────────────────────────────────────────────────────
// Run directly with:  node scoring.js
// Uses the PitchIQ demo pitch so you can verify the full round-trip.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const DEMO_PITCH =
    "We're building PitchIQ, an AI coach for founders. " +
    '40M startups pitch investors every year and 99% fail due to poor communication, ' +
    'not poor ideas. We use AI to give founders real-time VC-level feedback in seconds. ' +
    'We have 200 beta users, $2K MRR, and we\'re raising $750K to scale. ' +
    "I'm a 2x founder, my co-founder built ML systems at Google.";

  console.log('Running smoke test with demo pitch…\n');
  console.log('Pitch:', DEMO_PITCH, '\n');

  scorePitch(DEMO_PITCH)
    .then(result => {
      console.log('✅ Scorecard:\n', JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

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
const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT =
  'You are a battle-hardened VC who has seen 10,000 pitches. ' +
  'Score this pitch on 6 dimensions (1-10): problem_clarity, solution_strength, ' +
  'market_size, traction, team_credibility, ask_clarity. ' +
  'For each return: score, rationale, improved_version, and vc_question. ' +
  'Also return overall_score, investor_verdict (Pass/Maybe/Strong Interest/Term Sheet), ' +
  'top_strength, biggest_gap, memorable_line. ' +
  'Respond ONLY in valid JSON.';

// Expected shape for reference / consumers
export const RESULT_SHAPE = {
  problem_clarity:   { score: 0, rationale: '', improved_version: '', vc_question: '' },
  solution_strength: { score: 0, rationale: '', improved_version: '', vc_question: '' },
  market_size:       { score: 0, rationale: '', improved_version: '', vc_question: '' },
  traction:          { score: 0, rationale: '', improved_version: '', vc_question: '' },
  team_credibility:  { score: 0, rationale: '', improved_version: '', vc_question: '' },
  ask_clarity:       { score: 0, rationale: '', improved_version: '', vc_question: '' },
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
    const parsed = JSON.parse(cleaned);
    return validateAndFixScores(parsed, transcript.trim());
  } catch (parseErr) {
    throw new Error(
      `Claude returned non-JSON content. ` +
      `Parse error: ${parseErr.message}\n\n` +
      `Raw response (first 500 chars):\n${cleaned.slice(0, 500)}`
    );
  }
}

// Validate and fix common model loopholes and malformed results.
function clamp(n, lo = 1, hi = 10) {
  if (typeof n !== 'number' || Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function hasEvidence(transcript, patterns) {
  for (const p of patterns) if (p.test(transcript)) return true;
  return false;
}

function computeVerdict(score) {
  if (score >= 8) return 'Term Sheet';
  if (score >= 6) return 'Strong Interest';
  if (score >= 4) return 'Maybe';
  return 'Pass';
}

function validateAndFixScores(result, transcript) {
  const out = Object.assign({}, RESULT_SHAPE, result);
  const notes = [];

  // If transcript is extremely short, force low scores.
  if (!transcript || transcript.length < 30) {
    notes.push('Transcript too short — applying conservative low scores.');
    for (const key of Object.keys(RESULT_SHAPE)) {
      if (key === 'overall_score' || key === 'investor_verdict' || key === 'top_strength' || key === 'biggest_gap' || key === 'memorable_line') continue;
      if (out[key] && typeof out[key] === 'object') {
        out[key].score = 2;
        out[key].rationale = out[key].rationale || 'Insufficient content to assess this dimension.';
      }
    }
    out.overall_score = 2;
    out.investor_verdict = computeVerdict(out.overall_score);
    out.validation_notes = notes;
    return out;
  }

  // Evidence patterns
  const metricsPatterns = [ /\$\d+|\bMRR\b|\bARR\b|\busers\b|\bcustomers\b|revenue|paying|k\b|million|billion/i ];
  const teamPatterns = [ /\b(founder|co-?founder|CEO|CTO|CPO|ex-|built at|built ML|PhD|MD)\b/i ];
  const marketPatterns = [ /\b(market|TAM|total addressable market|users|customers|size|segments|industry)\b/i ];

  // Clamp and apply heuristic checks per-dimension
  const dims = ['problem_clarity','solution_strength','market_size','traction','team_credibility','ask_clarity'];
  for (const d of dims) {
    if (!out[d] || typeof out[d] !== 'object') out[d] = { score: 1, rationale: 'Missing metric from model.' };
    // normalize older key names if model returned them
    if (out[d].one_line_rationale && !out[d].rationale) out[d].rationale = out[d].one_line_rationale;
    out[d].score = clamp(out[d].score);
  }

  // Traction must have numeric/metric evidence
  if (out.traction.score >= 6 && !hasEvidence(transcript, metricsPatterns)) {
    notes.push('Traction was rated high but transcript lacks numeric metrics; reducing traction score.');
    out.traction.score = Math.min(out.traction.score, 4);
    out.traction.rationale = (out.traction.rationale || '') + ' (Adjusted: no numeric metrics found.)';
  }

  // Team credibility needs founder signals
  if (out.team_credibility.score >= 6 && !hasEvidence(transcript, teamPatterns)) {
    notes.push('Team credibility reduced — missing founder / track record signals.');
    out.team_credibility.score = Math.min(out.team_credibility.score, 5);
    out.team_credibility.rationale = (out.team_credibility.rationale || '') + ' (Adjusted: limited team evidence.)';
  }

  // Market size needs market language
  if (out.market_size.score >= 6 && !hasEvidence(transcript, marketPatterns)) {
    notes.push('Market size reduced — transcript lacks market/TAM language.');
    out.market_size.score = Math.min(out.market_size.score, 5);
    out.market_size.rationale = (out.market_size.rationale || '') + ' (Adjusted: limited market evidence.)';
  }

  // Recompute overall as average of validated dimension scores
  const sum = dims.reduce((s, k) => s + (out[k].score || 0), 0);
  const avg = sum / dims.length;
  out.overall_score = Math.round(avg * 10) / 10;
  out.investor_verdict = computeVerdict(out.overall_score);

  // top_strength & biggest_gap
  let top = dims[0], low = dims[0];
  for (const k of dims) {
    if (out[k].score > out[top].score) top = k;
    if (out[k].score < out[low].score) low = k;
  }
  out.top_strength = out[top].rationale || top;
  out.biggest_gap = out[low].rationale || low;

  out.validation_notes = notes;
  return out;
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
